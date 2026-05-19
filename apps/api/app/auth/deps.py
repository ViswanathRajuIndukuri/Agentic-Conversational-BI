"""FastAPI dependencies for Supabase JWT auth."""

from __future__ import annotations

from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import verify_supabase_access_token
from app.settings import get_settings

_bearer = HTTPBearer(auto_error=False)


def auth_is_required() -> bool:
    settings = get_settings()
    return bool(settings.supabase_url.strip()) and not settings.auth_disabled


async def require_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """Require a valid Supabase JWT when SUPABASE_URL is set (unless AUTH_DISABLED)."""
    if not auth_is_required():
        return {"sub": "anonymous", "email": None}

    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return verify_supabase_access_token(creds.credentials)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
