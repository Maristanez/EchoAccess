from backboard import BackboardClient
import os

BACKBOARD_API_KEY = os.getenv("BACKBOARD_API_KEY")
client = BackboardClient(api_key=BACKBOARD_API_KEY)


async def create_echoaccess_assistant():
    """Create the EchoAccess assistant. Persist the assistant_id and reuse it."""
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


async def create_session_thread(assistant_id: str):
    """Create a conversation thread for a user session."""
    thread = await client.create_thread(assistant_id)
    return thread.thread_id


async def send_with_memory(thread_id: str, content: str):
    """Send a message with automatic memory extraction enabled."""
    response = await client.add_message(
        thread_id=thread_id,
        content=content,
        memory="Auto",
        stream=False,
    )
    return response.content


async def store_context(thread_id: str, content: str):
    """Ingest context into memory without triggering an LLM response."""
    return await client.add_message(
        thread_id=thread_id,
        content=content,
        memory="Auto",
        send_to_llm=False,
    )


async def save_profile_field(thread_id: str, field_name: str, value: str):
    """Store a user profile field in long-term memory."""
    content = f"The user's {field_name} is {value}. Remember this for future forms."
    await store_context(thread_id, content)


async def ask_with_context(thread_id: str, prompt: str):
    """Send a prompt through Backboard which injects relevant memories."""
    response = await client.add_message(
        thread_id=thread_id,
        content=prompt,
        memory="Auto",
        stream=False,
    )
    return response.content
