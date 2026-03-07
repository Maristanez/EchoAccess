from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dependencies.auth import verify_token

from gemini_client import (
    parse_form_html,
    generate_question,
    generate_summary,
    explain_errors,
)
from backboard_client import (
    create_echoaccess_assistant,
    create_session_thread,
    store_context,
    save_profile_field,
    ask_with_context,
)

ASSISTANT_ID = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ASSISTANT_ID
    try:
        ASSISTANT_ID = await create_echoaccess_assistant()
    except Exception as e:
        print(f"Warning: Backboard init failed ({e}). Memory features disabled.")
        ASSISTANT_ID = None
    yield


app = FastAPI(title="EchoAccess API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROFILE_FIELD_MAP = {
    "name": "user_name",
    "first name": "user_name",
    "last name": "user_name",
    "full name": "user_name",
    "email": "user_email",
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


class NewSessionRequest(BaseModel):
    pass


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


# ── Routes ──


@app.get("/api/health")
async def health(token_payload: dict = Depends(verify_token)):
    return {"status": "ok", "backboard": ASSISTANT_ID is not None}


@app.get("/api/forms")
async def list_forms(token_payload: dict = Depends(verify_token)):
    return {
        "forms": [
            {"id": "bank-account", "name": "TD Bank Account Application"},
            {"id": "transit-card", "name": "TTC Disability Discount Card"},
            {"id": "cra-benefits", "name": "CRA Benefits Application"},
        ]
    }


@app.post("/api/parse-form")
async def parse_form(req: ParseFormRequest, token_payload: dict = Depends(verify_token)):
    form_path = f"forms/{req.form_name}.html"
    try:
        with open(form_path, "r") as f:
            raw_html = f.read()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Form '{req.form_name}' not found"
        )
    fields = await parse_form_html(raw_html)
    return {"fields": fields}


@app.post("/api/new-session")
async def new_session(token_payload: dict = Depends(verify_token)):
    if ASSISTANT_ID is None:
        return {"thread_id": None}
    thread_id = await create_session_thread(ASSISTANT_ID)
    return {"thread_id": thread_id}


@app.post("/api/chat")
async def chat(req: ChatRequest, token_payload: dict = Depends(verify_token)):
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

    # Get memory context from Backboard if available
    memory_context = ""
    if req.thread_id:
        try:
            memory_prompt = (
                f"The user is filling out the {req.form_name} form. "
                f"The next field is: {next_field['label']} (type: {next_field['type']}). "
                "What do you remember about this user that might help pre-fill this field?"
            )
            memory_context = await ask_with_context(req.thread_id, memory_prompt)
        except Exception:
            memory_context = ""

    result = await generate_question(
        form_name=req.form_name,
        next_field=next_field,
        answered=req.answered,
        profile={"memory_context": memory_context},
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
            if req.is_profile_field:
                await save_profile_field(req.thread_id, req.field_id, req.value)
        except Exception:
            pass
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
    summary = await generate_summary(req.form_name, req.answers)
    if req.thread_id:
        try:
            await store_context(
                req.thread_id,
                f"User completed the {req.form_name} form successfully.",
            )
        except Exception:
            pass
    return {"summary": summary}
