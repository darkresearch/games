# Sputnik MCP Server

A Model Context Protocol (MCP) server for controlling the Sputnik spaceship.

## Overview

This MCP server provides a standardized interface for AI agents to control Sputnik, a spaceship navigating through space to reach a target planet. The server exposes tools for sending commands to the spaceship and provides resources that give real-time information about the spaceship's current state.

## Features

- Real-time spaceship status as a resource
- Command to move the spaceship to specified coordinates
- Proper error handling for when the spaceship is already moving
- Clean API design following FastMCP best practices

## Installation

### Prerequisites

- Python 3.11 or higher
- uv package manager

### Setup

1. Clone this repository
2. Set up a virtual environment and install dependencies:

```bash
uv venv
uv pip install -e .
```

For development, include development dependencies:

```bash
uv pip install -e ".[dev]"
```

3. Configure environment variables by copying the .env.example file and adjusting as needed:

```bash
cp .env.example .env
```

## Usage

### Starting the server

```bash
cd src
python -m sputnik_mcp.main
```

The server will start on the configured host and port (default: http://0.0.0.0:8000).

### Interacting with the server

The server exposes an MCP interface that AI agents can connect to. It provides:

1. **Resources**: 
   - `spaceship_state`: Real-time information about the spaceship's position, velocity, etc.

2. **Tools**:
   - `move_spaceship`: Move the spaceship to specified x, y, z coordinates

## Development

### Running tests

```bash
pytest
```

### Formatting code

```bash
black src tests
isort src tests
```

## Architecture

The server follows a clean architecture:

- `api_client.py`: Handles communication with the Sputnik API
- `resources/spaceship.py`: Defines the spaceship state resource
- `tools/spaceship.py`: Implements the spaceship control tools
- `main.py`: Server entry point and configuration

## License

MIT 