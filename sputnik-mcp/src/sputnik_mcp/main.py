"""
Main entry point for the Sputnik MCP server
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastmcp import FastMCP

from .api_client import SputnikAPIClient

# Load environment variables
load_dotenv()

# API client singleton
_api_client = None


def get_api_client() -> SputnikAPIClient:
    """
    Get the API client singleton.
    The client is created on the first call and reused for subsequent calls.
    """
    global _api_client
    if _api_client is None:
        sputnik_url = os.getenv("SPUTNIK_API_URL", "http://localhost:3000")
        sputnik_api_key = os.getenv("SPUTNIK_API_KEY", "1234")
        _api_client = SputnikAPIClient(sputnik_url, sputnik_api_key)
    return _api_client


@asynccontextmanager
async def lifespan(app: FastMCP):
    """
    Lifecycle manager for the FastMCP application.
    Handles setup and teardown of resources.
    """
    # Setup - nothing to do as client is created on-demand
    yield
    
    # Cleanup - close the API client if it was created
    global _api_client
    if _api_client is not None:
        await _api_client.close()
        _api_client = None


# Initialize the FastMCP server
app = FastMCP(
    title="Sputnik MCP",
    description="Model Context Protocol server for controlling the Sputnik spaceship",
    version="0.1.0",
    lifespan=lifespan
)

# Import and register tools and resources
from .tools.spaceship import move_spaceship
from .resources.spaceship import spaceship_state

# Register tools
app.add_tool(move_spaceship)

# Register resources
app.add_resource(spaceship_state)


# Run the server if this module is executed directly
if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port = int(os.getenv("MCP_PORT", "8000"))
    
    print(f"Starting Sputnik MCP server on {host}:{port}")
    print(f"Connected to Sputnik API at {os.getenv('SPUTNIK_API_URL', 'http://localhost:3000')}")
    
    uvicorn.run("sputnik_mcp.main:app", host=host, port=port, reload=True) 