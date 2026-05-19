"""FastAPI app factory and lifespan."""
from __future__ import annotations

# IMPORTANT: load .env into os.environ BEFORE importing langchain/langgraph.
# pydantic-settings only populates the Settings object, but LangSmith reads
# from os.environ (e.g. LANGSMITH_TRACING) — so without this load, tracing
# silently stays off.
from pathlib import Path

from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_REPO_ROOT / ".env", override=False)

import logging  # noqa: E402
from contextlib import asynccontextmanager  # noqa: E402

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app.agent.graph import get_agent  # noqa: E402
from app.auth.deps import auth_is_required  # noqa: E402
from app.routers import chat, health  # noqa: E402
from app.settings import get_settings  # noqa: E402

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    import os

    tracing_on = os.getenv("LANGSMITH_TRACING", "").lower() in {"1", "true", "yes"}
    logger.info(
        "starting api: provider=%s model=%s mcp=%s auth=%s langsmith=%s%s",
        settings.llm_provider,
        settings.llm_model,
        settings.mcp_server_path,
        "required" if auth_is_required() else "off",
        "on" if tracing_on else "off",
        f" project={os.getenv('LANGSMITH_PROJECT','default')}" if tracing_on else "",
    )
    await get_agent()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Graphtic BI API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(chat.router)
    return app


app = create_app()
