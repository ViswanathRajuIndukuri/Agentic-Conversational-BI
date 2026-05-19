"""Single source of truth for LLM provider selection.

Adding Bedrock or OpenAI is a one-branch change here. Nothing in the agent
loop, tools, or routers should import provider SDKs directly.
"""
from __future__ import annotations

from langchain_core.language_models import BaseChatModel

from app.settings import Settings, get_settings


def get_chat_model(settings: Settings | None = None) -> BaseChatModel:
    settings = settings or get_settings()

    if settings.llm_provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic."
            )
        return ChatAnthropic(
            model=settings.llm_model,
            api_key=settings.anthropic_api_key,
            max_tokens=2048,
            timeout=60,
        )

    raise ValueError(
        f"Unsupported LLM_PROVIDER={settings.llm_provider!r}. "
        "Add a branch in app/llm/model.py to support it."
    )
