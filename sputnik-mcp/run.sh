#!/bin/bash

# Run the Sputnik MCP server

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Make sure dependencies are installed
echo "Installing dependencies..."
uv pip install -e .

# Run the server
echo "Starting the Sputnik MCP server..."
cd src
python -m sputnik_mcp.main 