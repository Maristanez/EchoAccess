from backboard import BackboardClient
import httpx
import os

BACKBOARD_API_KEY = os.getenv("BACKBOARD_API_KEY")
BACKBOARD_BASE_URL = "https://app.backboard.io/api"

client = BackboardClient(api_key=BACKBOARD_API_KEY)

# Human-readable labels for profile field IDs
_FIELD_LABELS = {
    "first_name": "first name",
    "last_name": "last name",
    "full_name": "full name",
    "user_name": "name",
    "email": "email address",
    "phone": "phone number",
    "phone_number": "phone number",
    "address": "home address",
    "home_address": "home address",
    "street": "street address",
    "city": "city",
    "province": "province",
    "postal_code": "postal code",
    "date_of_birth": "date of birth",
    "dob": "date of birth",
}


def _readable_field(field_id: str) -> str:
    """Convert a field ID (e.g. first_name) to a human label (e.g. 'first name')."""
    return _FIELD_LABELS.get(field_id, field_id.replace("_", " "))


async def create_echoaccess_assistant():
    """Create a new EchoAccess assistant and return its ID."""
    assistant = await client.create_assistant(
        name="EchoAccess Accessibility Copilot",
        system_prompt=(
            "You are EchoAccess, a warm and patient voice assistant helping "
            "blind and low-vision users fill out web forms conversationally. "
            "You remember user details across sessions to pre-fill forms. "
            "Always be clear, concise, and human-sounding."
        ),
    )
    return assistant.assistant_id


async def create_session_thread(assistant_id: str) -> str:
    """Create a conversation thread under a specific assistant."""
    thread = await client.create_thread(assistant_id)
    return thread.thread_id


async def store_context(thread_id: str, content: str) -> None:
    """Ingest context into memory without triggering an LLM response.

    Uses a direct HTTP call because the SDK does not expose send_to_llm.
    """
    async with httpx.AsyncClient(timeout=30) as http:
        r = await http.post(
            f"{BACKBOARD_BASE_URL}/threads/{thread_id}/messages",
            headers={"X-API-Key": BACKBOARD_API_KEY},
            data={"content": content, "memory": "Auto", "send_to_llm": "false"},
        )
    if r.status_code not in (200, 201):
        print(f"[backboard] store_context failed: {r.status_code} {r.text[:200]}")


async def save_profile_field(thread_id: str, field_id: str, value: str) -> None:
    """Store a user profile field in long-term memory with a normalized label."""
    label = _readable_field(field_id)
    content = f"The user's {label} is {value}. Remember this for future forms."
    await store_context(thread_id, content)


async def ask_with_context(thread_id: str, prompt: str) -> str:
    """Send a prompt through Backboard which injects relevant memories."""
    response = await client.add_message(
        thread_id=thread_id,
        content=prompt,
        memory="Auto",
        stream=False,
    )
    return response.content
