import os
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def _headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


async def get_user_session(user_id: str) -> dict | None:
    """Return existing {assistant_id, thread_id} for a user, or None."""
    if not _is_configured():
        return None
    url = f"{SUPABASE_URL}/rest/v1/user_sessions?user_id=eq.{user_id}&select=assistant_id,thread_id"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=_headers())
        if r.status_code == 200:
            rows = r.json()
            return rows[0] if rows else None
    except Exception as e:
        print(f"[supabase] get_user_session error: {e}")
    return None


async def upsert_user_session(user_id: str, assistant_id: str, thread_id: str) -> None:
    """Save or update a user's assistant+thread mapping."""
    if not _is_configured():
        return
    url = f"{SUPABASE_URL}/rest/v1/user_sessions"
    payload = {
        "user_id": user_id,
        "assistant_id": assistant_id,
        "thread_id": thread_id,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                url,
                headers={**_headers(), "Prefer": "resolution=merge-duplicates"},
                json=payload,
            )
    except Exception as e:
        print(f"[supabase] upsert_user_session error: {e}")
