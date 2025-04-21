# Sputnik Spaceship API Documentation

This documentation describes the API endpoints available for controlling and monitoring the Sputnik spaceship.

## Authentication

All API endpoints require authentication using an API key. Include the API key in the Authorization header of your request:

```
Authorization: Bearer YOUR_API_KEY
```

The API key can be found in your environment variables (`SPACESHIP_CONTROL_API_KEY`). For development, the default key is `1234`.

## Endpoints

### Control Spaceship

**Endpoint:** `/api/spaceship/control`  
**Method:** `POST`

This endpoint allows you to send commands to control the spaceship.

#### Command: `move_to`

Instructs the spaceship to move to a specific destination.

**Request:**

```json
{
  "command": "move_to",
  "destination": [x, y, z]
}
```

Where `[x, y, z]` are the 3D coordinates of the destination.

**Response:**

```json
{
  "success": true,
  "state": {
    "position": [x, y, z],
    "velocity": [vx, vy, vz],
    "rotation": [rx, ry, rz],
    "fuel": 95.5,
    "destination": [dx, dy, dz],
    "targetPlanet": "JUPITER"
  }
}
```

### Get Spaceship Status

**Endpoint:** `/api/spaceship/status`  
**Method:** `GET`

This endpoint provides the current status of the spaceship, including its position and movement information.

**Response:**

```json
{
  "success": true,
  "state": {
    "position": [x, y, z],
    "velocity": [vx, vy, vz],
    "rotation": [rx, ry, rz],
    "fuel": 95.5,
    "isMoving": true,
    "destination": [dx, dy, dz],
    "targetPlanet": "JUPITER"
  }
}
```

The `isMoving` field indicates whether the spaceship is currently moving toward a destination. When the spaceship is not moving, the `destination` field will be `null`.

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - The request was successful
- `400 Bad Request` - The request was invalid or missing required parameters
- `401 Unauthorized` - Invalid or missing API key
- `500 Internal Server Error` - Server-side error

Error responses include an error message:

```json
{
  "error": "Error message"
}
```
