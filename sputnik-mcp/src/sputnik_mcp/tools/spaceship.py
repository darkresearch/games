"""
Tools for controlling the Sputnik spaceship
"""

from typing import Any, Dict, Optional
import logging

import httpx
from pydantic import BaseModel, Field

from ..app import app, get_api_client

logger = logging.getLogger("sputnik_mcp.tools.spaceship")


class Vector3(BaseModel):
    """A 3D vector representing position, velocity or rotation"""
    x: float = Field(..., description="X component")
    y: float = Field(..., description="Y component")
    z: float = Field(..., description="Z component")


class SpaceshipState(BaseModel):
    """The current state of the Sputnik spaceship"""
    sputnik_id: Optional[str] = Field(None, description="ID of the spaceship (for multiplayer mode)")
    position: Vector3 = Field(..., description="Current position in 3D space")
    velocity: Vector3 = Field(..., description="Current velocity vector")
    rotation: Vector3 = Field(..., description="Current rotation in degrees")
    fuel: float = Field(..., description="Current fuel level percentage")
    is_moving: bool = Field(..., description="Whether the spaceship is currently moving")
    destination: Optional[Vector3] = Field(None, description="Destination coordinates if moving")
    target_planet: Optional[str] = Field(None, description="Target planet identifier")


# Input model for move_spaceship tool
class MoveRequest(BaseModel):
    """Input parameters for moving the spaceship"""
    x: float = Field(..., description="X-coordinate destination")
    y: float = Field(..., description="Y-coordinate destination")
    z: float = Field(..., description="Z-coordinate destination")
    sputnik_id: Optional[str] = Field(None, description="ID of the spaceship to move (for multiplayer mode)")


# Result model for move_spaceship tool
class MoveResult(BaseModel):
    """Result of a move command to the spaceship"""
    success: bool = Field(..., description="Whether the command was successful")
    error: Optional[str] = Field(None, description="Error message if command failed")
    current_destination: Optional[list[float]] = Field(None, description="Current destination if ship is already moving")
    state: Optional[Dict[str, Any]] = Field(None, description="Current state of the spaceship")
    sputnik_id: Optional[str] = Field(None, description="ID of the spaceship that was moved")


# Input model for get_spaceship_state tool
class SpaceshipStateRequest(BaseModel):
    """Input parameters for getting the spaceship state"""
    sputnik_id: Optional[str] = Field(None, description="ID of the spaceship to get status for (for multiplayer mode)")


@app.tool()
async def move_spaceship(request: MoveRequest) -> MoveResult:
    """
    Command the spaceship to move to the specified coordinates.
    Will fail if the spaceship is already moving to a destination.
    
    In multiplayer mode, you can specify which spaceship to move by providing a sputnik_id.
    If no sputnik_id is provided, the default spaceship will be moved.
    
    Args:
        request: The coordinates to move the spaceship to
        
    Returns:
        Result of the move command with success status
    """
    client = get_api_client()
    
    try:
        result = await client.move_to(request.x, request.y, request.z, request.sputnik_id)
        return MoveResult(
            success=True,
            state=result.get("state"),
            sputnik_id=result.get("uuid") or request.sputnik_id
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 409:
            # The spaceship is already moving
            error_data = e.response.json()
            return MoveResult(
                success=False,
                error="Spaceship is already moving to a destination. Wait until it arrives before sending another move command.",
                current_destination=error_data.get("currentDestination"),
                sputnik_id=request.sputnik_id
            )
        # Some other error occurred
        return MoveResult(
            success=False,
            error=f"Failed to move spaceship: {str(e)}",
            sputnik_id=request.sputnik_id
        )
    except Exception as e:
        return MoveResult(
            success=False,
            error=f"An unexpected error occurred: {str(e)}",
            sputnik_id=request.sputnik_id
        )


@app.tool()
async def get_spaceship_state(request: SpaceshipStateRequest) -> SpaceshipState:
    """
    Get the current state of the Sputnik spaceship including position, velocity,
    rotation, fuel level, and movement status.
    
    In multiplayer mode, you can specify which spaceship to query by providing a sputnik_id.
    If no sputnik_id is provided, the default spaceship will be queried.
    
    Args:
        request: The parameters for getting the spaceship state
        
    Returns:
        The current state of the spaceship
    """
    sputnik_id = request.sputnik_id or ""
    logger.info(f"Received request for spaceship state with ID: {sputnik_id}")
    
    try:
        client = get_api_client()
        logger.debug(f"Using API client with base URL: {client.base_url}")
        
        logger.info(f"Requesting status from API for spaceship: {sputnik_id}")
        result = await client.get_status(sputnik_id)
        logger.debug(f"Received API response: {result}")
        
        state_data = result["state"]
        
        # Create the position vector
        position = Vector3(
            x=state_data["position"][0],
            y=state_data["position"][1],
            z=state_data["position"][2]
        )
        
        # Create the velocity vector
        velocity = Vector3(
            x=state_data["velocity"][0],
            y=state_data["velocity"][1],
            z=state_data["velocity"][2]
        )
        
        # Create the rotation vector
        rotation = Vector3(
            x=state_data["rotation"][0],
            y=state_data["rotation"][1],
            z=state_data["rotation"][2]
        )
        
        # Create destination vector if it exists
        destination = None
        if state_data.get("destination"):
            destination = Vector3(
                x=state_data["destination"][0],
                y=state_data["destination"][1],
                z=state_data["destination"][2]
            )
        
        # Return the full spaceship state
        spaceship_state = SpaceshipState(
            sputnik_id=result.get("uuid"),
            position=position,
            velocity=velocity,
            rotation=rotation,
            fuel=state_data["fuel"],
            is_moving=state_data["isMoving"],
            destination=destination,
            target_planet=state_data.get("targetPlanet")
        )
        logger.info(f"Successfully created spaceship state for {sputnik_id}")
        return spaceship_state
    except Exception as e:
        logger.error(f"Error getting spaceship state: {e}", exc_info=True)
        raise 