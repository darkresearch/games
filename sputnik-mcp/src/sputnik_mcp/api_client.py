"""
API client for interacting with the Sputnik API
"""

from typing import Dict, List, Optional, TypedDict, Union, Any

import httpx


class SputnikAPIClient:
    """Client for interacting with the Sputnik spaceship API"""

    def __init__(self, base_url: str, api_key: str):
        """
        Initialize the Sputnik API client
        
        Args:
            base_url: Base URL of the Sputnik API (e.g., http://localhost:3000)
            api_key: API key for authentication
        """
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        self._client = httpx.AsyncClient(headers=self.headers, timeout=10.0)
    
    async def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the spaceship
        
        Returns:
            Current spaceship status including position, velocity, etc.
        
        Raises:
            httpx.HTTPStatusError: If the API returns an error status
        """
        url = f"{self.base_url}/api/spaceship/status"
        response = await self._client.get(url)
        response.raise_for_status()
        return response.json()
    
    async def move_to(self, x: float, y: float, z: float) -> Dict[str, Any]:
        """
        Send a command to move the spaceship to the specified coordinates
        
        Args:
            x: X-coordinate destination
            y: Y-coordinate destination
            z: Z-coordinate destination
            
        Returns:
            Response from the API containing the result of the command
            
        Raises:
            httpx.HTTPStatusError: If the API returns an error status
        """
        url = f"{self.base_url}/api/spaceship/control"
        data = {
            "command": "move_to",
            "destination": [x, y, z]
        }
        response = await self._client.post(url, json=data)
        response.raise_for_status()
        return response.json()
        
    async def close(self) -> None:
        """Close the HTTP client"""
        await self._client.aclose() 