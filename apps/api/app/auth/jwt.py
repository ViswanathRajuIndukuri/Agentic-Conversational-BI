"""Verify Supabase Auth access tokens (JWT) via JWKS."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient

from app.settings import get_settings


@lru_cache
def _jwks_client(supabase_url: str) -> PyJWKClient:
    issuer = supabase_url.rstrip("/") + "/auth/v1"
    return PyJWKClient(f"{issuer}/.well-known/jwks.json")


def verify_supabase_access_token(token: str) -> dict[str, Any]:
    """Validate a Supabase user JWT and return its claims."""
    settings = get_settings()
    url = settings.supabase_url.strip()
    if not url:
        raise RuntimeError("SUPABASE_URL is not configured")

    issuer = url.rstrip("/") + "/auth/v1"
    key = _jwks_client(url).get_signing_key_from_jwt(token).key
    return jwt.decode(
        token,
        key,
        algorithms=["RS256", "ES256", "HS256"],
        audience="authenticated",
        issuer=issuer,
        options={"require": ["exp", "sub"]},
    )
