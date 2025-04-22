"""
Tools for controlling the Sputnik spaceship
"""

from typing import Any, Dict, Optional

import httpx
from fastmcp import tool
from pydantic import BaseModel, Field

from ..api_client import SputnikAPIClient


# Input model for move_spaceship tool
class MoveRequest(BaseModel):
    """Input parameters for moving the spaceship"""
    x: float = Field(..., description="X-coordinate destination")
    y: float = Field(..., description="Y-coordinate destination")
    z: float = Field(..., description="Z-coordinate destination")


# Result model for move_spaceship tool
class MoveResult(BaseModel):
    """Result of a move command to the spaceship"""
    success: bool = Field(..., description="Whether the command was successful")
    error: Optional[str] = Field(None, description="Error message if command failed")
    current_destination: Optional[list[float]] = Field(None, description="Current destination if ship is already moving")
    state: Optional[Dict[str, Any]] = Field(None, description="Current state of the spaceship")


# Get API client from context
def get_api_client() -> SputnikAPIClient:
    """Get the API client from FastMCP context"""
    from ..main import get_api_client
    return get_api_client()


@tool
async def move_spaceship(request: MoveRequest) -> MoveResult:
    """
    Command the spaceship to move to the specified coordinates.
    Will fail if the spaceship is already moving to a destination.
    
    Args:
        request: The coordinates to move the spaceship to
        
    Returns:
        Result of the move command with success status
    """
    client = get_api_client()
    
    try:
        result = await client.move_to(request.x, request.y, request.z)
        return MoveResult(
            success=True,
            state=result.get("state")
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 409:
            # The spaceship is already moving
            error_data = e.response.json()
            return MoveResult(
                success=False,
                error="Spaceship is already moving to a destination. Wait until it arrives before sending another move command.",
                current_destination=error_data.get("currentDestination")
            )
        # Some other error occurred
        return MoveResult(
            success=False,
            error=f"Failed to move spaceship: {str(e)}"
        )
    except Exception as e:
        return MoveResult(
            success=False,
            error=f"An unexpected error occurred: {str(e)}"
        ) 