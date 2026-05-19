"""Local MetricFlow MCP server.

Exposes a small, deterministic surface over the `mf` CLI so an LLM client can
reason about the dbt semantic layer without inventing metric or dimension
names. The contract here mirrors MetricFlow's own CLI semantics 1:1 — see
https://docs.getdbt.com/docs/build/metricflow-commands.

Tools:
  - list_metrics(search?)
  - list_dimensions(metrics)
  - list_dimension_values(metrics, dimension, start_time?, end_time?)
  - list_entities(metrics)
  - query_metric(metrics, group_by?, start_time?, end_time?, where?, order_by?,
                 limit?)

Hard rules baked into the tool layer (so the LLM cannot accidentally violate
MetricFlow's input contract):
  - `metrics` must be a non-empty list.
  - `start_time`/`end_time` must be ISO-8601 date or datetime strings.
  - `where` is a list of MetricFlow template predicates; each is forwarded as
    its own `--where` flag (mf AND-combines them).
  - `mf` errors are returned verbatim alongside the exact command we ran, so
    the LLM can self-correct on the next step.
"""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

# Load repo-root `.env` before reading DBT_PROJECT_DIR / MF_BIN from os.environ.
# `override=False` keeps values already set by the parent process (e.g. Docker
# Compose) and only fills in missing keys from the file.
load_dotenv(Path(__file__).resolve().parent / ".env", override=False)

import os  # noqa: E402
import re  # noqa: E402
import subprocess  # noqa: E402
from typing import Optional  # noqa: E402

from mcp.server.fastmcp import FastMCP  # noqa: E402

mcp = FastMCP("local-metricflow")


def _require_env(name: str) -> str:
    """Fail loudly if a required env var is missing.

    All path-style configuration is centralized in the repo `.env` (and
    remapped to container paths in docker-compose.yml). We never fall back
    to a hardcoded value here — that just hides config drift.
    """
    val = os.environ.get(name, "").strip()
    if not val:
        raise RuntimeError(
            f"{name} is not set. Define it in .env (or pass it via the "
            f"environment) before launching the MCP server."
        )
    return val


DBT_PROJECT_DIR = _require_env("DBT_PROJECT_DIR")
MF_BIN = _require_env("MF_BIN")

# Strip terminal control sequences (mf uses spinners) so the LLM sees clean
# tabular output, not "⠋ 🔍 Looking for...".
_ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[a-zA-Z]|[\u2800-\u28ff]")
_SPINNER_PHRASES_RE = re.compile(r"🔍 Looking for [^\n]*", re.IGNORECASE)

_ISO_DATE_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+\-]\d{2}:?\d{2})?)?$"
)


def _clean(text: str) -> str:
    text = _ANSI_RE.sub("", text or "")
    text = _SPINNER_PHRASES_RE.sub("", text)
    return text.strip()


def _run_mf(args: list[str]) -> str:
    """Invoke `mf <args>` in the dbt project dir and return cleaned output.

    On non-zero exit, returns a structured error string that includes both
    streams plus the command we ran. This is what the LLM sees as the tool
    result, so it must be readable enough to self-correct against.
    """
    cmd = [MF_BIN, *args]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=DBT_PROJECT_DIR,
        )
    except FileNotFoundError as exc:
        return f"Error: cannot execute mf binary at {MF_BIN}: {exc}"

    stdout = _clean(result.stdout)
    stderr = _clean(result.stderr)

    if result.returncode == 0:
        return stdout or "(mf returned no output)"

    parts = [p for p in (stderr, stdout) if p]
    detail = "\n".join(parts) if parts else "(no stderr/stdout from mf)"
    pretty_cmd = "mf " + " ".join(args)
    return (
        f"Error (exit {result.returncode}) running `{pretty_cmd}`:\n{detail}"
    )


def _validate_metrics(metrics: list[str]) -> Optional[str]:
    if not metrics:
        return "Error: `metrics` must be a non-empty list. Call list_metrics() first if unsure."
    bad = [m for m in metrics if not isinstance(m, str) or not m.strip()]
    if bad:
        return f"Error: invalid metric entries: {bad!r}"
    return None


def _validate_iso(name: str, value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if not _ISO_DATE_RE.match(value):
        return (
            f"Error: `{name}` must be an ISO-8601 date (YYYY-MM-DD) or "
            f"datetime, got {value!r}."
        )
    return None


@mcp.tool()
def list_metrics(search: Optional[str] = None) -> str:
    """List metrics defined in the local dbt semantic layer.

    Output is one bullet per metric in the form
    `• metric_name: dim1, dim2, ... and N more`.

    Args:
        search: Optional case-insensitive filter; only metrics whose name
            matches the substring are returned (forwarded as
            `mf list metrics --search <text>`).
    """
    args = ["list", "metrics"]
    if search:
        args += ["--search", search]
    return _run_mf(args)


@mcp.tool()
def list_dimensions(metrics: list[str]) -> str:
    """List dimensions common to every metric in `metrics` (intersection).

    Output is the set of dimension identifiers that are usable as
    `--group-by` values or inside `Dimension('...')` template wrappers.
    Identifiers are typically `entity__dim_name` (e.g. `order__order_status`)
    or the special `metric_time` time dimension.

    Args:
        metrics: One or more metric names from list_metrics.
    """
    if err := _validate_metrics(metrics):
        return err
    return _run_mf(["list", "dimensions", "--metrics", ",".join(metrics)])


@mcp.tool()
def list_dimension_values(
    metrics: list[str],
    dimension: str,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
) -> str:
    """List the distinct values a categorical dimension takes for given metrics.

    Use this when the user filters by a value you have not seen before
    (e.g. "show revenue for delivered orders") and you need to confirm the
    exact spelling/casing of valid values before constructing a `where`
    predicate.

    Args:
        metrics: Metrics that the dimension is associated with.
        dimension: Fully-qualified dimension identifier (e.g.
            `order__order_status`).
        start_time: Optional ISO-8601 date/datetime lower bound (inclusive).
        end_time: Optional ISO-8601 date/datetime upper bound (inclusive).
    """
    if err := _validate_metrics(metrics):
        return err
    if not dimension or not dimension.strip():
        return "Error: `dimension` must be a non-empty string."
    for label, value in (("start_time", start_time), ("end_time", end_time)):
        if err := _validate_iso(label, value):
            return err

    args = [
        "list",
        "dimension-values",
        "--metrics",
        ",".join(metrics),
        "--dimension",
        dimension,
    ]
    if start_time:
        args += ["--start-time", start_time]
    if end_time:
        args += ["--end-time", end_time]
    return _run_mf(args)


@mcp.tool()
def list_entities(metrics: list[str]) -> str:
    """List entities (e.g. `order`, `customer`) common to the given metrics.

    Useful for resolving the correct primary entity prefix when constructing
    a non-time dimension reference (`<entity>__<dim>`).
    """
    if err := _validate_metrics(metrics):
        return err
    return _run_mf(["list", "entities", "--metrics", ",".join(metrics)])


@mcp.tool()
def query_metric(
    metrics: list[str],
    group_by: Optional[list[str]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    where: Optional[list[str]] = None,
    order_by: Optional[list[str]] = None,
    limit: Optional[int] = None,
) -> str:
    """Run `mf query` and return the result table.

    Args:
        metrics: Metric names from list_metrics. Required, non-empty.
        group_by: Dimensions / entities to group by. Time grain uses the
            `metric_time__<grain>` form, e.g. `metric_time__month`. Non-time
            dimensions must be entity-prefixed, e.g. `order__order_status`.
            Multiple group-bys are passed comma-joined to `--group-by`.
        start_time: ISO-8601 inclusive lower bound on `metric_time`.
            **Always prefer this for calendar ranges** instead of putting
            time predicates in `where`.
        end_time: ISO-8601 inclusive upper bound on `metric_time`.
        where: List of MetricFlow predicate strings. Each is forwarded as a
            separate `--where` flag (mf AND-combines them). Use the template
            wrappers:
              * Non-time dim:  ``{{ Dimension('order__order_status') }} = 'delivered'``
              * Time dim:      ``{{ TimeDimension('metric_time', 'week') }} >= '2024-02-01'``
            Do NOT use raw SQL functions like `YEAR(...)` or
            `metric_time__year = 2018`; those will not resolve.
        order_by: List of metric/dim identifiers to order by. Prefix with `-`
            for DESC. Example: `["-metric_time__month"]`.
        limit: Max rows to return. Defaults to whatever `mf` chooses (no
            cap) when omitted. Pass an integer to truncate.

    Examples:
        Total revenue (no group by, no time filter):
            query_metric(metrics=["revenue"])
        Monthly revenue for 2018, chronological:
            query_metric(metrics=["revenue"],
                         group_by=["metric_time__month"],
                         start_time="2018-01-01", end_time="2018-12-31",
                         order_by=["metric_time__month"])
        Revenue by order status, delivered orders only:
            query_metric(metrics=["revenue"],
                         group_by=["order__order_status"],
                         where=["{{ Dimension('order__order_status') }} = 'delivered'"])
    """
    if err := _validate_metrics(metrics):
        return err
    for label, value in (("start_time", start_time), ("end_time", end_time)):
        if err := _validate_iso(label, value):
            return err
    if limit is not None and (not isinstance(limit, int) or limit <= 0):
        return f"Error: `limit` must be a positive int if provided, got {limit!r}."

    args: list[str] = ["query", "--metrics", ",".join(metrics)]
    if group_by:
        args += ["--group-by", ",".join(group_by)]
    if start_time:
        args += ["--start-time", start_time]
    if end_time:
        args += ["--end-time", end_time]
    if where:
        for predicate in where:
            if not isinstance(predicate, str) or not predicate.strip():
                return f"Error: every `where` entry must be a non-empty string, got {predicate!r}."
            args += ["--where", predicate]
    if order_by:
        args += ["--order", ",".join(order_by)]
    if limit is not None:
        args += ["--limit", str(limit)]

    return _run_mf(args)


if __name__ == "__main__":
    mcp.run()
