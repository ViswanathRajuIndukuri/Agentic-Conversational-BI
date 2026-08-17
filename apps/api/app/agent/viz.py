"""Parse `query_metric` tool output into a viz payload for the chat SSE stream.

The MCP server returns JSON on success (`columns` + `rows` only) and an
`Error: ...` string on failure. The same structured rows feed the LLM, the
`viz` SSE event, and the UI table — charts must never be inferred from the
model's markdown.
"""
from __future__ import annotations

import json
import re
from typing import Any

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)
_PREVIEW_ROWS = 8


def _tool_output_text(output: Any) -> str:
    if output is None:
        return ""
    if isinstance(output, str):
        return output
    content = getattr(output, "content", None)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text") or block.get("content") or ""))
            else:
                parts.append(str(getattr(block, "text", "") or ""))
        return "".join(parts)
    if isinstance(output, dict):
        if "columns" in output and "rows" in output:
            return json.dumps(output)
        return str(output.get("content") or output)
    return str(output)


def _loads_json(text: str) -> dict[str, Any] | None:
    stripped = _FENCE_RE.sub("", text.strip())
    if not stripped.startswith("{"):
        return None
    try:
        data = json.loads(stripped)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _format_rows_preview(payload: dict[str, Any], limit: int = _PREVIEW_ROWS) -> str:
    """Compact audit-trace preview derived from structured rows (UI only)."""
    columns = payload.get("columns")
    rows = payload.get("rows")
    if not isinstance(columns, list) or not isinstance(rows, list):
        return ""
    if not columns:
        return "(no columns)"
    header = " | ".join(str(c) for c in columns)
    lines = [header, "-" * min(len(header), 60)]
    for row in rows[:limit]:
        if not isinstance(row, list):
            continue
        cells = ["" if v is None else str(v) for v in row[: len(columns)]]
        lines.append(" | ".join(cells))
    if len(rows) > limit:
        lines.append(f"({len(rows) - limit} more rows)")
    if payload.get("truncated"):
        lines.append("(result truncated at server row cap)")
    return "\n".join(lines)


def preview_from_output(output: Any) -> str:
    """Short audit-trace text for the tool panel (not sent to the LLM)."""
    text = _tool_output_text(output)
    payload = _loads_json(text)
    if payload and payload.get("ok") is True:
        preview = _format_rows_preview(payload)
        if preview:
            return preview
    return text


def parse_query_viz(tool_name: str, output: Any) -> dict[str, Any] | None:
    """Return a JSON-serializable viz payload, or None if this isn't chartable."""
    if tool_name != "query_metric":
        return None
    payload = _loads_json(_tool_output_text(output))
    if not payload or payload.get("ok") is not True:
        return None
    columns = payload.get("columns")
    rows = payload.get("rows")
    if not isinstance(columns, list) or not isinstance(rows, list):
        return None
    metrics = payload.get("metrics") if isinstance(payload.get("metrics"), list) else []
    group_by = payload.get("group_by") if isinstance(payload.get("group_by"), list) else []
    return {
        "metrics": [str(m) for m in metrics],
        "group_by": [str(g) for g in group_by],
        "start_time": payload.get("start_time"),
        "end_time": payload.get("end_time"),
        "columns": [str(c) for c in columns],
        "rows": rows,
        "truncated": bool(payload.get("truncated")),
    }
