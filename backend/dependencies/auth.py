import os
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    secret = os.getenv("SUPABASE_JWT_SECRET")
    
    if not secret:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured")
        
    try:
        # Supabase uses HS256 for JWT
        # The audience is usually 'authenticated' for logged in users
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False} # Skip audience verification for simplicity, or set to 'authenticated'
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
