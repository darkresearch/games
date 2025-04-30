"""
Main entry point for the Sputnik MCP server
"""

import logging
import os

from dotenv import load_dotenv

# Load environment variables before anything else
load_dotenv()

# Import app after environment is loaded
from .app import app, logger

# Run the server if this module is executed directly
if __name__ == "__main__":
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port = int(os.getenv("MCP_PORT", "8000"))
    
    logger.info(f"Starting Sputnik MCP server on {host}:{port}")
    logger.info(f"Connected to Sputnik API at {os.getenv('SPUTNIK_API_URL', 'http://localhost:3000')}")
    logger.info(f"Python version: {os.sys.version}")
    
    # Use the built-in run method with SSE transport (supports host/port)
    app.run(transport='sse', host=host, port=port) 