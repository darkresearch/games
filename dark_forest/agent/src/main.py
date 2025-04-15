"""SPUTNIK app definition using MCPApp."""

import asyncio

from mcp_agent.app import MCPApp
from mcp_agent.agents.agent import Agent
from mcp_agent.workflows.llm.augmented_llm_openai import OpenAIAugmentedLLM
from .utils import load_instructions, update_secrets_from_env

# Hardcoded values
DEFAULT_PROMPT = "What is something insightful you've been thinking about?"
AGENT_NAME = "SPUTNIK"
INSTRUCTION_FILE = "instructions.txt"

# Update `mcp_agent.secrets.yaml` from environment variables
update_secrets_from_env()

# Create the app
sputnik_app = MCPApp(name="sputnik")

async def run():
    async with sputnik_app.run() as app:
        context = app.context
        logger = app.logger

        logger.info(f"Starting SPUTNIK with prompt: '{DEFAULT_PROMPT}'")
        logger.info("Current config:", data=context.config.model_dump())

        # Load instructions
        instructions = load_instructions(INSTRUCTION_FILE)

        agent = Agent(
            name=AGENT_NAME,
            instruction=instructions,
        )
        
        async with agent:
            # Automatically initializes the MCP servers and adds their tools for LLM use
            tools = await agent.list_tools()
            logger.info("Tools available:", data=tools)

            # Attach an OpenAI LLM to the agent
            # Model is specified in `mcp_agent.config.py`
            llm = await agent.attach_llm(OpenAIAugmentedLLM)

            conversation_history = []

            # Infinite game loop
            while True:
                if len(conversation_history) == 0:
                    prompt = DEFAULT_PROMPT
                else:
                    # Get the previous response from the conversation history
                    previous_response = conversation_history[-1]["content"]
                    
                    prompt = f"""
                    Reflect on your previous insight:
                    
                    {previous_response}

                    {f"In the context of the earlier conversation: {conversation_history[-10:-1]}" if len(conversation_history) > 1 else ""}
                    """

                response = await llm.generate_str(message=prompt)

                conversation_history.append({
                    "role": "reflection",
                    "content": response
                })


if __name__ == "__main__":
    asyncio.run(run())
