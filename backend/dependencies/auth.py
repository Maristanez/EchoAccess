import os
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Required auth - returns 401 when no/invalid token
security = HTTPBearer()

# Optional auth - returns None when no/invalid token (for public-ish endpoints)
security_optional = HTTPBearer(auto_error=False)

_jwks_client: PyJWKClient | None = None

def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        # Supabase URLs use .co not .com
        supabase_url = (os.getenv("SUPABASE_URL") or os.getenv("Project_URL", "")).replace(".com", ".co")
        jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client

def _decode_token(token: str) -> dict:
    """Decode and verify JWT. Raises HTTPException on failure."""
    # Try RS256/ES256 via JWKS first (Supabase JWKS)
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        pass  # Fall through to HS256

    # Fall back to HS256 with JWT secret (legacy Supabase)
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured")
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"[auth] JWT decode failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    return _decode_token(credentials.credentials)

def verify_token_optional(credentials: HTTPAuthorizationCredentials | None = Security(security_optional)):
    """Optional auth - returns None if no/invalid token instead of 401."""
    if credentials is None:
        return None
    try:
        return _decode_token(credentials.credentials)
    except HTTPException:
        return None
