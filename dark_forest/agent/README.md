# SPUTNIK - The Endless Reflective Agent

A self-reflective agent named SPUTNIK that engages in continuous conversations with itself using the MCP-Agent framework.

## Overview

SPUTNIK is implemented as a proper MCP application using the MCPApp class from the mcp-agent framework. The agent follows this process:

1. Starts with the prompt "Tell me something insightful"
2. Answers the prompt to the best of its ability
3. Reflects on its answer, identifying strengths and weaknesses
4. Produces an improved answer based on its reflection
5. Repeats the reflection process indefinitely, continuously improving its insights

The reflection process runs indefinitely until manually stopped with Ctrl+C.

## Installation

### Prerequisites

- Python 3.11+
- `uv` package manager (recommended)

### Setup

1. Clone this repository

2. Install dependencies using `uv`:

```bash
uv add mcp-agent openai
```

3. Add your API key to `mcp_agent.secrets.yaml`:

```yaml
llm:
  provider:
    openai:
      api_key: "YOUR_OPENAI_API_KEY"
```

## Usage

Simply run SPUTNIK with:

```bash
python -m reflective_agent
```

SPUTNIK will start with the prompt "Tell me something insightful" and continuously reflect on and improve its answer until you stop it with Ctrl+C.

## How It Works

SPUTNIK is implemented as an MCP app with the following components:

1. **App Definition**: The app is created using `MCPApp` from the mcp-agent framework
2. **Agent Loop**: The reflection process runs inside the app's context
3. **Logging**: Uses the built-in MCP logger for consistent output formatting
4. **Exception Handling**: Properly handles interruptions and errors

## Customizing SPUTNIK

While the agent name and prompt are hardcoded, you can still customize SPUTNIK's behavior by modifying the instructions in the `instructions.md` file. The markdown formatting in this file is preserved and passed to the agent, allowing for rich text formatting including headers, bold text, lists, and more.

## Architecture

- `app.py`: Defines the MCP app and the main reflection loop
- `__main__.py`: Entry point for running the app
- `instructions.md`: File containing SPUTNIK's instructions with markdown formatting

## License

MIT 