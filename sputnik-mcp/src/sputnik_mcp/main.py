"""
Main entry point for the Sputnik MCP server
"""

import os

from dotenv import load_dotenv

# Load environment variables before anything else
load_dotenv()

# Import app after environment is loaded
from .app import app

# Run the server if this module is executed directly
if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port = int(os.getenv("MCP_PORT", "8000"))
    
    print(f"Starting Sputnik MCP server on {host}:{port}")
    print(f"Connected to Sputnik API at {os.getenv('SPUTNIK_API_URL', 'http://localhost:3000')}")
    
    uvicorn.run("sputnik_mcp.main:app", host=host, port=port, reload=True) 