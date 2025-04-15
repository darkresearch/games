"""SPUTNIK app definition using MCPApp."""

import asyncio

from mcp_agent.app import MCPApp
from mcp_agent.agents.agent import Agent
from mcp_agent.workflows.llm.augmented_llm_openai import OpenAIAugmentedLLM
from mcp_agent.context import ContextVariables
from utils import load_instructions, update_secrets_from_env

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
            logger.info(f"Tools available:", data=tools)

            # Attach an OpenAI LLM to the agent
            # Model is specified in `mcp_agent.config.py`
            llm = await agent.attach_llm(OpenAIAugmentedLLM)

            # Context variables
            context_variables = ContextVariables()
            context_variables["question"] = DEFAULT_PROMPT
            context_variables["conversation_history"] = []

            # This will perform a file lookup and read using the filesystem server
            response = await llm.generate_str(message=DEFAULT_PROMPT)
            logger.info(f"Response: {response}")

            conversation_history = []
            conversation_history.append({
                "role": "initial_answer",
                "content": response
            })

            context_variables["conversation_history"] = conversation_history

            # Infinite game loop
            while True:
                reflection_prompt = f"""
                Reflect on your previous insight:
                
                {response}
                """

                reflection = await llm.generate_str(message=reflection_prompt, context_variables=context_variables)

                conversation_history.append({
                    "role": "reflection",
                    "content": reflection
                })

                context_variables["conversation_history"] = conversation_history


if __name__ == "__main__":
    asyncio.run(run())
