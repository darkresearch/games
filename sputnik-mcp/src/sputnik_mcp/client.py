"""
API client for interacting with the Sputnik API
"""

import logging
import os
from typing import Dict, Any, Optional

import httpx

logger = logging.getLogger("sputnik_mcp.client")


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
        logger.info(f"Creating API client with base URL: {base_url}")
        self._client = httpx.AsyncClient(headers=self.headers, timeout=30.0)  # Increased timeout
    
    async def get_status(self, sputnik_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get the current status of the spaceship
        
        Args:
            sputnik_id: Optional ID of the spaceship to get status for (for multiplayer mode)
            
        Returns:
            Current spaceship status including position, velocity, etc.
        
        Raises:
            httpx.HTTPStatusError: If the API returns an error status
        """
        url = f"{self.base_url}/api/spaceship/status"
        
        # Add sputnik_id as query parameter if provided
        params = {}
        if sputnik_id:
            params["uuid"] = sputnik_id
        
        logger.debug(f"Making GET request to {url} with params: {params}")
        try:
            response = await self._client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Successfully received API response for {sputnik_id or 'default'} spaceship")
            return data
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code} from Sputnik API: {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error when connecting to Sputnik API: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_status: {str(e)}", exc_info=True)
            raise
    
    async def move_to(self, x: float, y: float, z: float, sputnik_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Send a command to move the spaceship to the specified coordinates
        
        Args:
            x: X-coordinate destination
            y: Y-coordinate destination
            z: Z-coordinate destination
            sputnik_id: Optional ID of the spaceship to move (for multiplayer mode)
            
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
        
        # Add sputnik_id to request if provided
        if sputnik_id:
            data["uuid"] = sputnik_id
        
        logger.debug(f"Making POST request to {url} with data: {data}")
        try:    
            response = await self._client.post(url, json=data)
            response.raise_for_status()
            result = response.json()
            logger.debug(f"Successfully sent move command for {sputnik_id or 'default'} spaceship")
            return result
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code} from Sputnik API: {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error when connecting to Sputnik API: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in move_to: {str(e)}", exc_info=True)
            raise
        
    async def close(self) -> None:
        """Close the HTTP client"""
        logger.debug("Closing API client")
        await self._client.aclose()


# Factory function to create a client from environment variables
def create_client() -> SputnikAPIClient:
    """
    Create a new API client using environment variables
    
    Returns:
        Configured SputnikAPIClient instance
    """
    sputnik_url = os.getenv("SPUTNIK_API_URL", "http://localhost:3000")
    sputnik_api_key = os.getenv("SPUTNIK_API_KEY", "1234")
    
    # Log environment configuration
    logger.info(f"Creating API client with URL from environment: {sputnik_url}")
    if not sputnik_url.startswith(("http://", "https://")):
        logger.warning(f"SPUTNIK_API_URL doesn't include protocol: {sputnik_url}")
        sputnik_url = f"http://{sputnik_url}"
        logger.info(f"Added http:// protocol. URL is now: {sputnik_url}")
    
    return SputnikAPIClient(sputnik_url, sputnik_api_key) 