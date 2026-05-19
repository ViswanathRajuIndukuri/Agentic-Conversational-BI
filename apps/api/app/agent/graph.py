"""LangGraph agent assembly.

Uses LangChain v1's `create_agent` — the modern, supported replacement for
LangGraph's older `create_react_agent`. Same agent/tools loop shape, plus
hooks for middleware, structured output, interrupts, and a cross-thread store
that we'll wire in for charts/voice/persistence later.
"""

from __future__ import annotations

from typing import Any

from langchain.agents import create_agent
from langgraph.checkpoint.memory import MemorySaver

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import load_tools
from app.llm.model import get_chat_model

_agent: Any = None


async def get_agent() -> Any:
    """Build (once) and return the compiled agent. Idempotent and async-safe
    for FastAPI's single-event-loop lifecycle."""
    global _agent
    if _agent is None:
        tools = await load_tools()
        _agent = create_agent(
            model=get_chat_model(),
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=MemorySaver(),
        )
    return _agent
