"""
Resource for representing the Sputnik spaceship state
"""

import logging
from typing import Optional

from pydantic import BaseModel, Field

from ..app import app, get_api_client

logger = logging.getLogger("sputnik_mcp.resources.spaceship")


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


@app.resource("https://sputnik-mcp.onrender.com/spaceship-4/{sputnik_id}")
async def spaceship_state_4(sputnik_id: str) -> bool:
    """
    Test
    """
    return True

@app.resource("data:/spaceship-4/{sputnik_id}")
async def spaceship_state_4(sputnik_id: str) -> bool:
    """
    Test
    """
    return True

@app.resource("spaceship-3/{sputnik_id}")
async def spaceship_state_3(sputnik_id: str) -> bool:
    """
    Test
    """
    return True

@app.resource("/spaceship-2/{sputnik_id}")
async def spaceship_state_2(sputnik_id: str) -> bool:
    """
    Test
    """
    return True 