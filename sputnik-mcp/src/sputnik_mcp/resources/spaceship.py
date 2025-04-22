"""
Resource for representing the Sputnik spaceship state
"""

from typing import Optional

from fastmcp import resource
from pydantic import BaseModel, Field

from ..api_client import SputnikAPIClient


class Vector3(BaseModel):
    """A 3D vector representing position, velocity or rotation"""
    x: float = Field(..., description="X component")
    y: float = Field(..., description="Y component")
    z: float = Field(..., description="Z component")


class SpaceshipState(BaseModel):
    """The current state of the Sputnik spaceship"""
    position: Vector3 = Field(..., description="Current position in 3D space")
    velocity: Vector3 = Field(..., description="Current velocity vector")
    rotation: Vector3 = Field(..., description="Current rotation in degrees")
    fuel: float = Field(..., description="Current fuel level percentage")
    is_moving: bool = Field(..., description="Whether the spaceship is currently moving")
    is_refueling: bool = Field(False, description="Whether the spaceship is currently refueling")
    destination: Optional[Vector3] = Field(None, description="Destination coordinates if moving")
    target_planet: Optional[str] = Field(None, description="Target planet identifier")


# Get API client from context
def get_api_client() -> SputnikAPIClient:
    """Get the API client from FastMCP context"""
    from ..main import get_api_client
    return get_api_client()


@resource
async def spaceship_state() -> SpaceshipState:
    """
    Current state of the Sputnik spaceship including position, velocity,
    rotation, fuel level, and movement status.
    """
    client = get_api_client()
    result = await client.get_status()
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
    return SpaceshipState(
        position=position,
        velocity=velocity,
        rotation=rotation,
        fuel=state_data["fuel"],
        is_moving=state_data["isMoving"],
        is_refueling=state_data.get("isRefueling", False),
        destination=destination,
        target_planet=state_data.get("targetPlanet")
    ) 