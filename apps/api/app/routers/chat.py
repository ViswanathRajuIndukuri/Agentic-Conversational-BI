"""POST /chat — streams the agent's response as Server-Sent Events.

Event vocabulary (small and stable on purpose):

    event: ready          {"thread_id": "..."}
    event: tool_call      {"name": "...", "args": {...}}
    event: tool_result    {"name": "...", "preview": "..."}
    event: text_delta     {"delta": "..."}
    event: error          {"message": "..."}
    event: done           {}
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator
from uuid import uuid4

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage

from app.agent.graph import get_agent
from app.auth.deps import require_user
from app.schemas import ChatRequest
from app.settings import get_settings

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

_TOOL_PREVIEW_CHARS = 800

# LangGraph (v1+) injects framework state into a tool's call kwargs (e.g. a
# ToolRuntime via langchain-mcp-adapters). Strip these from the args we send
# over the wire — they're not user-visible "tool arguments".
_INTERNAL_TOOL_ARG_KEYS = {"runtime", "config", "store", "state", "tool_call_id"}


def _sse(event: str, payload: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, default=str)}\n\n"


def _extract_text(chunk: Any) -> str:
    """LangChain message chunks may carry a string or a list of typed blocks."""
    content = getattr(chunk, "content", None)
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
            elif isinstance(block, str):
                parts.append(block)
        return "".join(parts)
    return ""


def _clean_tool_args(raw: Any) -> dict[str, Any]:
    """Return only the user-visible tool arguments.

    `astream_events`'s `on_tool_start` reports the *final* kwargs passed into
    the tool wrapper, which includes framework-injected fields like
    `runtime: ToolRuntime`. Filter those out and ensure the rest is JSON-safe.
    """
    if not isinstance(raw, dict):
        return {}
    cleaned: dict[str, Any] = {}
    for k, v in raw.items():
        if k in _INTERNAL_TOOL_ARG_KEYS:
            continue
        try:
            json.dumps(v)
            cleaned[k] = v
        except (TypeError, ValueError):
            cleaned[k] = repr(v)
    return cleaned


def _capture_tool_call_args(chunk: Any, store: dict[str, dict[str, Any]]) -> None:
    """Remember tool_call.args keyed by tool_call_id from a streamed AIMessage.

    These are the *clean* args the model intended — preferable to whatever the
    framework forwards into the tool's kwargs at execution time.
    """
    tool_calls = getattr(chunk, "tool_calls", None) or []
    for call in tool_calls:
        cid = call.get("id") if isinstance(call, dict) else getattr(call, "id", None)
        args = call.get("args") if isinstance(call, dict) else getattr(call, "args", None)
        name = call.get("name") if isinstance(call, dict) else getattr(call, "name", None)
        if cid:
            store[cid] = {"name": name, "args": args or {}}


async def _stream_agent(req: ChatRequest) -> AsyncIterator[str]:
    settings = get_settings()
    agent = await get_agent()

    thread_id = req.thread_id or str(uuid4())
    yield _sse("ready", {"thread_id": thread_id})

    config = {
        "configurable": {"thread_id": thread_id},
        "recursion_limit": settings.recursion_limit,
    }
    inputs = {"messages": [HumanMessage(content=req.message)]}

    pending_calls: dict[str, dict[str, Any]] = {}

    try:
        async for event in agent.astream_events(inputs, config=config, version="v2"):
            kind = event.get("event")
            data = event.get("data") or {}

            if kind == "on_chat_model_stream":
                chunk = data.get("chunk")
                text = _extract_text(chunk)
                if text:
                    yield _sse("text_delta", {"delta": text})
                _capture_tool_call_args(chunk, pending_calls)

            elif kind == "on_chat_model_end":
                _capture_tool_call_args(data.get("output"), pending_calls)

            elif kind == "on_tool_start":
                tool_call_id = (event.get("metadata") or {}).get("tool_call_id")
                clean = pending_calls.get(tool_call_id, {}).get("args") if tool_call_id else None
                if clean is None:
                    clean = _clean_tool_args(data.get("input"))
                yield _sse(
                    "tool_call",
                    {"name": event.get("name", ""), "args": clean},
                )

            elif kind == "on_tool_end":
                preview = str(data.get("output", ""))
                if len(preview) > _TOOL_PREVIEW_CHARS:
                    preview = preview[:_TOOL_PREVIEW_CHARS] + "…"
                yield _sse(
                    "tool_result",
                    {"name": event.get("name", ""), "preview": preview},
                )

    except Exception as exc:
        logger.exception("agent stream failed")
        yield _sse("error", {"message": str(exc)})
    finally:
        yield _sse("done", {})


@router.post("")
async def chat(
    req: ChatRequest,
    _user: dict = Depends(require_user),
) -> StreamingResponse:
    return StreamingResponse(
        _stream_agent(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
