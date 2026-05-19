from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Process-wide configuration, loaded from .env and the environment.

    Path-style settings (MCP_PYTHON_BIN, MCP_SERVER_PATH) are **required**:
    we don't hardcode fallbacks here — `.env` is the single source of truth
    for the host, and docker-compose.yml remaps them for the container.
    """

    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    llm_provider: str = "anthropic"
    llm_model: str = "claude-sonnet-4-5"
    anthropic_api_key: str | None = None

    mcp_python_bin: str
    mcp_server_path: str

    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"]
    )
    log_level: str = "INFO"
    recursion_limit: int = 24

    # Supabase Auth — when set, POST /chat requires Authorization: Bearer <JWT>.
    # Set AUTH_DISABLED=true to bypass (local dev only).
    supabase_url: str = ""
    auth_disabled: bool = False

    @field_validator("mcp_python_bin", "mcp_server_path")
    @classmethod
    def _non_empty_path(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(
                f"{info.field_name.upper()} must be set in .env "
                f"(no hardcoded fallback)."
            )
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
