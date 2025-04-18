# SPUTNIK Spaceship Control API Documentation

This document describes the API endpoints that the Python AI agent can use to control the spaceship in the SPUTNIK game.

## Authentication

All control endpoints require authentication using a Bearer token in the Authorization header.

```
Authorization: Bearer YOUR_API_KEY
```

The API key should be provided to the Python service as an environment variable and kept secure.

## Direct Supabase Access

For retrieving the spaceship state, the AI agent should connect directly to Supabase instead of using an API endpoint. The spaceship state can be retrieved and subscribed to using the Supabase client.

## Endpoints

### Control Spaceship

Sends commands to control the spaceship.

**URL**: `/api/spaceship/control`

**Method**: `POST`

**Authentication**: Required

**Command Types**:

1. **Move with Direction and Magnitude**

```json
{
  "command": "move",
  "direction": { "x": 0, "y": 0, "z": 1 },
  "magnitude": 100
}
```

2. **Move to Target Position**

```json
{
  "command": "move",
  "target": [500, 0, 1000],
  "speed": 200
}
```

3. **Stop Movement**

```json
{
  "command": "stop"
}
```

4. **Set Target Planet**

```json
{
  "command": "set_target",
  "target_planet_id": 42
}
```

5. **Directly Set State**

```json
{
  "command": "set_state",
  "position": [100, 200, 300],
  "velocity": [10, 0, 20],
  "fuel": 85
}
```

**Response**:
```json
{
  "success": true,
  "state": {
    "position": [100, 200, 300],
    "velocity": [10, 0, 20],
    "rotation": [0, 0, 0, 1],
    "fuel": 85,
    "targetPlanet": 42
  }
}
```

## Error Responses

### Authentication Error

```json
{
  "error": "Unauthorized"
}
```

### Invalid Command Format

```json
{
  "error": "Invalid command format"
}
```

### Invalid Command Parameters

```json
{
  "error": "Invalid command parameters"
}
```

### Server Error

```json
{
  "error": "Failed to update spaceship state",
  "details": "Error message details"
}
```

## Implementation Notes

### State Management

The spaceship state is stored in Supabase and updates are propagated in real-time to all connected clients. The web app displays the spaceship position, movement, and status based on this state.

### Spaceship State Structure

The spaceship state has the following structure:

```typescript
type SpaceshipStateData = {
  id: string;
  position: [number, number, number]; // 3D position as array [x, y, z]
  velocity: [number, number, number]; // 3D velocity as array [x, y, z]
  rotation: [number, number, number, number]; // Quaternion [x, y, z, w]
  fuel: number; // Percentage (0-100)
  target_planet_id: string | null; // Target planet ID
  updated_at: string; // ISO datetime
};
```

### Target Planet

The target planet ID is fixed for the entire game (TARGET_PLANET_ID constant). While the API includes it in responses, the AI agent should not need to update it during normal operation.

### Physics Simulation

While the API allows direct control of position and velocity, the frontend applies physics interpolation between updates to ensure smooth movement. This means:

1. The Python agent doesn't need to send updates at 60fps
2. Position updates will be interpolated for visual smoothness
3. The agent should account for this when planning precise movements

### Resource Management

The agent should monitor the fuel level through the Supabase state. Landing on planets allows refueling, which the agent should factor into navigation planning.

## Example Code (Python)

```python
import os
import json
import requests
from supabase import create_client, Client

# API Setup
API_URL = "https://your-sputnik-game.com/api/spaceship"
API_KEY = os.environ.get("SPACESHIP_CONTROL_API_KEY")

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

# Get current status from Supabase
def get_status():
    response = supabase.table('spaceship_state').select('*').order('updated_at', desc=True).limit(1).execute()
    if len(response.data) > 0:
        return response.data[0]
    return None

# Move in a direction
def move_in_direction(x, y, z, magnitude):
    command = {
        "command": "move",
        "direction": {"x": x, "y": y, "z": z},
        "magnitude": magnitude
    }
    response = requests.post(
        f"{API_URL}/control", 
        headers=headers,
        json=command
    )
    return response.json()

# Set target destination
def move_to_position(x, y, z, speed):
    command = {
        "command": "move",
        "target": [x, y, z],
        "speed": speed
    }
    response = requests.post(
        f"{API_URL}/control", 
        headers=headers,
        json=command
    )
    return response.json()

# Stop the spaceship
def stop():
    command = {
        "command": "stop"
    }
    response = requests.post(
        f"{API_URL}/control", 
        headers=headers,
        json=command
    )
    return response.json()
``` 