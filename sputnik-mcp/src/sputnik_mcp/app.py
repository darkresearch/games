"""
FastMCP application configuration for Sputnik MCP
"""

from contextlib import asynccontextmanager

from fastmcp import FastMCP

from .client import create_client, SputnikAPIClient

# API client instance that will be initialized during startup
api_client = None


def get_api_client() -> SputnikAPIClient:
    """
    Get the current API client instance.
    Note: Only available after application startup.
    
    Returns:
        The API client instance
    """
    global api_client
    if not api_client:
        raise RuntimeError("API client not initialized. Application might not have started yet.")
    return api_client


@asynccontextmanager
async def lifespan(app: FastMCP):
    """
    Lifecycle manager for the FastMCP application.
    Handles API client initialization and cleanup.
    """
    # Initialize API client on startup
    global api_client
    api_client = create_client()
    
    yield
    
    # Clean up on shutdown
    if api_client:
        await api_client.close()
        api_client = None


# Create the FastMCP application instance
app = FastMCP(
    title="Sputnik MCP",
    description="Model Context Protocol server for controlling the Sputnik spaceship",
    version="0.1.0",
    lifespan=lifespan
)

# Import tools and resources - these will register automatically
# via the decorators once imported
from .tools.spaceship import move_spaceship  # noqa
from .resources.spaceship import spaceship_state  # noqa 