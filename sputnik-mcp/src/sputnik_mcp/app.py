"""
FastMCP application configuration for Sputnik MCP
"""

from contextlib import asynccontextmanager
import logging
import sys

from fastmcp import FastMCP

from .client import create_client, SputnikAPIClient

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("sputnik_mcp")

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
        logger.error("API client not initialized. Application might not have started yet.")
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
    logger.info("Initializing API client")
    api_client = create_client()
    logger.info(f"API client initialized with URL: {api_client.base_url}")
    
    yield
    
    # Clean up on shutdown
    if api_client:
        logger.info("Closing API client")
        await api_client.close()
        api_client = None


# Create the FastMCP application instance
app = FastMCP(
    title="Sputnik MCP",
    description="Model Context Protocol server for controlling the Sputnik spaceship",
    version="0.1.0",
    lifespan=lifespan
)

# Import tools - these will register automatically via the decorators once imported
from .tools.spaceship import move_spaceship, get_spaceship_state  # noqa 