"""
Test client for the Sputnik MCP server.

This script is used to verify that the MCP server is working correctly.
It connects to the server and checks the spaceship state resource
and tests the move_spaceship tool.
"""

import asyncio
import json
import os
from typing import Any, Dict

import httpx
from dotenv import load_dotenv


async def test_server():
    """Test the MCP server endpoints"""
    # Load environment variables
    load_dotenv()
    
    # Get server URL
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port = os.getenv("MCP_PORT", "8000")
    server_url = f"http://{host}:{port}"
    
    print(f"Testing MCP server at {server_url}")
    
    # Create HTTP client
    async with httpx.AsyncClient() as client:
        # Get spaceship state resource
        print("\n=== Testing spaceship_state resource ===")
        resource_url = f"{server_url}/resources/spaceship_state"
        try:
            response = await client.get(resource_url)
            if response.status_code == 200:
                state = response.json()
                print(f"SUCCESS: Got spaceship state")
                print(json.dumps(state, indent=2))
            else:
                print(f"ERROR: Failed to get spaceship state")
                print(f"Status code: {response.status_code}")
                print(f"Response: {response.text}")
                return
        except Exception as e:
            print(f"ERROR: Exception while getting spaceship state: {str(e)}")
            return
        
        # Test move_spaceship tool
        print("\n=== Testing move_spaceship tool ===")
        tool_url = f"{server_url}/tools/move_spaceship"
        try:
            payload = {
                "x": 100.0,
                "y": 100.0,
                "z": 100.0
            }
            response = await client.post(tool_url, json=payload)
            if response.status_code == 200:
                result = response.json()
                print(f"SUCCESS: Move command sent")
                print(json.dumps(result, indent=2))
            else:
                print(f"ERROR: Failed to send move command")
                print(f"Status code: {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"ERROR: Exception while sending move command: {str(e)}")


if __name__ == "__main__":
    asyncio.run(test_server()) 