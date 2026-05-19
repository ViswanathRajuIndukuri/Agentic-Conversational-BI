# syntax=docker/dockerfile:1.7
# Multi-stage build for the FastAPI + LangGraph agent + MCP server.
# Build context: repository root (see docker-compose.yml).

# ─────────────────────────────────────────────────────────────
# Stage 1: build a virtualenv with Poetry
# ─────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS builder

ENV POETRY_VERSION=2.1.0 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# Toolchain + headers for any source-only wheels (e.g. dbt adapters)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install "poetry==${POETRY_VERSION}"

WORKDIR /app

# Copy only manifests first so the dep layer is cached across code changes.
COPY pyproject.toml poetry.lock ./

RUN --mount=type=cache,target=${POETRY_CACHE_DIR} \
    poetry install --no-root

# ─────────────────────────────────────────────────────────────
# Stage 2: lean runtime image
# ─────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runtime

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Runtime-only system libs (libpq5 covers dbt-postgres if it ships in poetry.lock).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1000 app \
    && useradd  --system --uid 1000 --gid app --home /app --shell /sbin/nologin app

WORKDIR /app

# Carry the resolved virtualenv from the builder.
COPY --from=builder --chown=app:app ${VIRTUAL_ENV} ${VIRTUAL_ENV}

# App code + local MCP server. Keeping the same on-disk layout as the repo
# means apps/api/app/settings.py's `parents[3]` still resolves to /app, and
# all default paths (.venv/bin/python, local_dbt_mcp.py) just work.
COPY --chown=app:app apps/api ./apps/api
COPY --chown=app:app local_dbt_mcp.py ./

USER app

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
    CMD python -c "import urllib.request,sys; \
sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2).status == 200 else 1)"

# tini reaps the MCP-server subprocess cleanly on container stop.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "app.main:app", \
     "--app-dir", "apps/api", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
