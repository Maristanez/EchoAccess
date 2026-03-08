from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root (works regardless of cwd)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from dependencies.auth import verify_token, verify_token_optional

from gemini_client import (
    parse_form_html,
    generate_question,
    generate_summary,
    extract_answer,
)
from backboard_client import (
    create_echoaccess_assistant,
    create_session_thread,
    store_context,
    save_profile_field,
    ask_with_context,
)
from supabase_client import get_user_session, upsert_user_session

# ── Fix 1: Global fallback assistant (persisted across restarts via env var) ──
FALLBACK_ASSISTANT_ID: str | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global FALLBACK_ASSISTANT_ID
    # Use persisted ID if configured (avoids creating a new assistant on every restart)
    env_id = os.getenv("BACKBOARD_ASSISTANT_ID")
    if env_id:
        FALLBACK_ASSISTANT_ID = env_id
        print(f"[backboard] Reusing assistant {FALLBACK_ASSISTANT_ID}")
    else:
        try:
            FALLBACK_ASSISTANT_ID = await create_echoaccess_assistant()
            print(
                f"[backboard] Created new assistant {FALLBACK_ASSISTANT_ID}\n"
                f"  → Add BACKBOARD_ASSISTANT_ID={FALLBACK_ASSISTANT_ID} to .env to persist across restarts."
            )
        except Exception as e:
            print(f"[backboard] Init failed ({e}). Memory features disabled.")
            FALLBACK_ASSISTANT_ID = None
    yield


app = FastAPI(title="EchoAccess API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROFILE_FIELD_MAP = {
    "name": "user_name",
    "first name": "first_name",
    "last name": "last_name",
    "full name": "full_name",
    "email": "email",
    "address": "home_address",
    "street": "home_address",
    "phone": "phone_number",
    "date of birth": "date_of_birth",
    "dob": "date_of_birth",
    "city": "city",
    "postal code": "postal_code",
    "province": "province",
}


def detect_profile_field(label: str) -> str | None:
    """Check if a form field label maps to a persistent profile field."""
    label_lower = label.lower()
    for keyword, profile_key in PROFILE_FIELD_MAP.items():
        if keyword in label_lower:
            return profile_key
    return None


# ── Request Models ──


class ParseFormRequest(BaseModel):
    form_name: str


class ChatRequest(BaseModel):
    thread_id: str | None = None
    form_name: str
    fields: list
    current_field_index: int
    answered: list


class SaveAnswerRequest(BaseModel):
    thread_id: str | None = None
    field_id: str
    value: str
    is_profile_field: bool = False


class SubmitFormRequest(BaseModel):
    thread_id: str | None = None
    form_name: str
    answers: list


class ExtractAnswerRequest(BaseModel):
    field: dict
    question: str
    user_response: str


class TTSRequest(BaseModel):
    text: str


# ── Routes ──


@app.get("/health")
async def health_public():
    return {"status": "ok", "backboard": FALLBACK_ASSISTANT_ID is not None}


@app.get("/api/health")
async def health(token_payload: dict = Depends(verify_token)):
    return {"status": "ok", "backboard": FALLBACK_ASSISTANT_ID is not None}


@app.get("/api/forms")
async def list_forms(_token: dict | None = Depends(verify_token_optional)):
    """Forms list is public so it loads even if JWT verification has issues."""
    return {
        "forms": [
            {"id": "bank-account", "name": "TD Bank Account Application"},
            {"id": "transit-card", "name": "TTC Disability Discount Card"},
            {"id": "cra-benefits", "name": "CRA Benefits Application"},
        ]
    }


@app.post("/api/parse-form")
async def parse_form(req: ParseFormRequest, _token: dict | None = Depends(verify_token_optional)):
    form_path = f"forms/{req.form_name}.html"
    try:
        with open(form_path, "r") as f:
            raw_html = f.read()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Form '{req.form_name}' not found"
        )
    try:
        fields = await parse_form_html(raw_html)
    except Exception as e:
        print(f"[parse-form] Gemini error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service temporarily unavailable: {e}",
        )
    return {"fields": fields}


@app.post("/api/new-session")
async def new_session(token_payload: dict = Depends(verify_token)):
    """
    Fix 2+3: Return a stable thread for this user, isolated per user.

    Flow:
      1. Try Supabase lookup → return existing thread (per-user assistant).
      2. If not found → create a new per-user assistant + thread, store in Supabase.
      3. If Supabase unavailable → fall back to global FALLBACK_ASSISTANT_ID.
    """
    user_id: str = token_payload.get("sub", "")

    # ── Supabase path (Fix 2+3) ──
    if user_id:
        existing = await get_user_session(user_id)
        if existing:
            print(f"[session] Reusing thread {existing['thread_id']} for user {user_id[:8]}…")
            return {"thread_id": existing["thread_id"]}

        # Create a per-user assistant for memory isolation (Fix 3)
        try:
            user_assistant_id = await create_echoaccess_assistant()
            thread_id = await create_session_thread(user_assistant_id)
            await upsert_user_session(user_id, user_assistant_id, thread_id)
            print(f"[session] Created assistant {user_assistant_id} + thread {thread_id} for user {user_id[:8]}…")
            return {"thread_id": thread_id}
        except Exception as e:
            print(f"[session] Per-user assistant creation failed ({e}), falling back to global.")

    # ── Fallback to global assistant (Fix 1) ──
    if FALLBACK_ASSISTANT_ID is None:
        return {"thread_id": None}
    try:
        thread_id = await create_session_thread(FALLBACK_ASSISTANT_ID)
        return {"thread_id": thread_id}
    except Exception as e:
        print(f"[session] Thread creation failed: {e}")
        return {"thread_id": None}


@app.post("/api/chat")
async def chat(req: ChatRequest, _token: dict | None = Depends(verify_token_optional)):
    next_field = (
        req.fields[req.current_field_index]
        if req.current_field_index < len(req.fields)
        else None
    )
    if not next_field:
        return {
            "question": "You've answered all the fields! Let me read back your answers.",
            "suggestion": None,
        }

    memory_context = ""
    if req.thread_id:
        try:
            memory_prompt = (
                f"The user is filling out the {req.form_name} form. "
                f"The next field is: {next_field['label']} (type: {next_field['type']}). "
                "What do you remember about this user that might help pre-fill this field?"
            )
            memory_context = await ask_with_context(req.thread_id, memory_prompt)
        except Exception as e:
            print(f"[chat] ask_with_context failed: {e}")
            memory_context = ""

    try:
        result = await generate_question(
            form_name=req.form_name,
            next_field=next_field,
            answered=req.answered,
            profile={"memory_context": memory_context},
        )
    except Exception as e:
        print(f"[chat] Gemini error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service temporarily unavailable: {e}",
        )
    return result


@app.post("/api/save-answer")
async def save_answer(req: SaveAnswerRequest, token_payload: dict = Depends(verify_token)):
    if req.thread_id:
        try:
            await store_context(
                req.thread_id,
                f"User answered '{req.field_id}' with value: {req.value}",
            )
        except Exception as e:
            print(f"[save-answer] store_context failed: {e}")

        if req.is_profile_field:
            try:
                await save_profile_field(req.thread_id, req.field_id, req.value)
            except Exception as e:
                print(f"[save-answer] save_profile_field failed: {e}")

    return {"ok": True}


@app.get("/api/user-profile")
async def user_profile(thread_id: str | None = None, token_payload: dict = Depends(verify_token)):
    if not thread_id:
        return {"profile": {}}
    try:
        response = await ask_with_context(
            thread_id,
            "List everything you remember about this user: name, email, phone, address, date of birth. Return as JSON.",
        )
        return {"profile": response}
    except Exception:
        return {"profile": {}}


@app.post("/api/submit-form")
async def submit_form(req: SubmitFormRequest, token_payload: dict = Depends(verify_token)):
    try:
        summary = await generate_summary(req.form_name, req.answers)
    except Exception as e:
        print(f"[submit-form] Gemini error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI service temporarily unavailable: {e}",
        )
    if req.thread_id:
        try:
            await store_context(
                req.thread_id,
                f"User completed the {req.form_name} form successfully.",
            )
        except Exception as e:
            print(f"[submit-form] store_context failed: {e}")
    return {"summary": summary}


@app.post("/api/extract-answer")
async def extract_answer_route(req: ExtractAnswerRequest, token_payload: dict = Depends(verify_token)):
    try:
        result = await extract_answer(
            field=req.field,
            question=req.question,
            user_response=req.user_response,
        )
        return result
    except Exception as e:
        print(f"[extract-answer] Gemini error: {e}")
        # Fallback: return raw response so form filling doesn't break
        return {"value": req.user_response, "needs_reask": False}


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": req.text,
                "model_id": "eleven_flash_v2_5",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                },
            },
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="ElevenLabs API error")
    return Response(content=resp.content, media_type="audio/mpeg")
