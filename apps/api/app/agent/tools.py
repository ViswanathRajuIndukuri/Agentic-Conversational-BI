"""Loads MCP tools from the local-dbt server into LangChain `BaseTool`s."""
from __future__ import annotations

import os

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.settings import get_settings

_client: MultiServerMCPClient | None = None

def get_mcp_client() -> MultiServerMCPClient:
    global _client
    if _client is None:
        settings = get_settings()
        # The MCP stdio transport launches the server with a *scrubbed* env by
        # default — MF_BIN / DBT_PROJECT_DIR / DBT_PROFILES_DIR / warehouse
        # creds would all be dropped. Forward the parent process's env so the
        # subprocess inherits everything compose/.env put in place.
        _client = MultiServerMCPClient(
            {
                "local-dbt": {
                    "command": settings.mcp_python_bin,
                    "args": [settings.mcp_server_path],
                    "transport": "stdio",
                    "env": dict(os.environ),
                }
            }
        )
    return _client


async def load_tools() -> list[BaseTool]:
    """Discover MCP tools and return them in LangChain tool format."""
    return await get_mcp_client().get_tools()
