from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8_000)
    thread_id: str | None = Field(default=None, description="Reuse to continue a conversation.")
