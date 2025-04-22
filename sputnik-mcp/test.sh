#!/bin/bash

# Run the Sputnik MCP test client

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

# Run the test client
echo "Starting the test client..."
cd src
python -m sputnik_mcp.test_client 