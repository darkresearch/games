"""SPUTNIK app definition using MCPApp."""

import asyncio
import json
import os
import datetime
from pathlib import Path

from mcp_agent.app import MCPApp
from mcp_agent.agents.agent import Agent
from mcp_agent.workflows.llm.augmented_llm import RequestParams
from mcp_agent.workflows.llm.augmented_llm_openai import OpenAIAugmentedLLM
from .utils import load_markdown_instructions, update_secrets_from_env

INITIAL_PROMPT = """
Your player address is 0xDD8563f2B62f9c92891AB0d4Ef45350cFEa10Cc8. What is your location?
"""

# Hardcoded values
INITIAL_PROMPT_OLD = """
You are now playing the Dark Forest game. 

First, use the dark_forest tool to understand your current game state (location, energy level, etc).
Then, plan and execute your first move based on the Dark Forest game rules.

Your ultimate goal is to locate a hidden target planet through exploration. Remember that:
- You don't know which planet is the target or where it is
- You must use the mine_chunk tool to explore and reveal regions of the universe
- Once you discover planets, you can move your ship to them
- Upon finding the target planet, you must land on it and let it charge to 100% energy

When moving between planets, use the wait tool to allow time for your ship to complete its journey.
Example: wait({"seconds": 30}) to wait 30 seconds before checking your location.

Remember to maintain your own understanding of:
1. Your current location (planet ID and energy)
2. Known planets (visited/unvisited, energy levels)
3. Target planet status (found/not found)
4. Wallet status ($SOL, $USDC, $DARK holdings)
5. Movement status (if in transit, destination and estimated arrival time)

For each turn, clearly document your observations, strategy, and chosen action.
"""

TURN_PROMPT = """
This is your next turn in the Dark Forest game.

First, use the dark_forest tool to get updated game state if needed.
Then, decide on your next move based on your previous actions and current situation.

Remember your mission is to find the hidden target planet - which you don't know the location of yet.
You'll need to continue exploring the universe using the mine_chunk tool to discover new planets,
and strategically move your ship to navigate through the universe.

If you've initiated a move in your previous turn and are in transit:
- Use the wait tool to allow sufficient time for your move to complete
- Example: wait({"seconds": 30}) to wait 30 seconds
- Only check your location after waiting an appropriate amount of time

Remember to:
1. Update your understanding of the game state
2. Document any new observations or strategy changes
3. Choose and execute exactly ONE action:
   - Mine a chunk to explore
   - Move to a planet
   - Buy $DARK tokens
   - Send $DARK to Treasury
   - Wait for an in-progress move to complete

Be clear about your reasoning and maintain your knowledge of the game world.
"""

AGENT_NAME = "SPUTNIK"
INSTRUCTION_FILE = "instructions.md"
STATE_FILE = "agent_state.json"
AGENT_LOG_FILE = "agent-output.log"

# Update `mcp_agent.secrets.yaml` from environment variables
update_secrets_from_env()

# Create the app
sputnik_app = MCPApp(name="sputnik", human_input_callback=None)

# Define the wait function that will be registered as a tool
async def wait_function(seconds: int) -> str:
    """
    Wait for a specified number of seconds. Use this when waiting for ship movements to complete.
    
    Args:
        seconds: Number of seconds to wait
        
    Returns:
        A message confirming the wait completed
    """
    # Cap the wait time to a reasonable maximum (e.g., 15 minutes)
    max_wait = 900  # 15 minutes
    wait_time = min(seconds, max_wait)
    
    # Wait for the specified duration
    await asyncio.sleep(wait_time)
    
    # Return a message indicating completion
    return f"Waited for {wait_time} seconds. You can now check your game state."

def log_to_file(message: str, move_number: int = None):
    """
    Log a message to the agent output file with timestamp and move number.
    
    Args:
        message: The message to log
        move_number: Optional move number to include
    """
    timestamp = datetime.datetime.now().isoformat()
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    log_path = log_dir / AGENT_LOG_FILE
    
    # Format the log entry
    header = f"===== MOVE {move_number} | {timestamp} ====="
    footer = "=" * len(header)
    
    log_entry = f"{header}\n\n{message}\n\n{footer}\n\n"
    
    # Append to the log file
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(log_entry)

async def run():
    async with sputnik_app.run() as app:
        context = app.context
        logger = app.logger

        logger.info(f"Starting SPUTNIK for Dark Forest game")
        logger.info("Current config:", data=context.config.model_dump())

        # Load instructions from markdown file, preserving formatting
        instructions = load_markdown_instructions(INSTRUCTION_FILE)

        agent = Agent(
            name=AGENT_NAME,
            instruction=instructions,
            server_names=["solana", "dark_forest"], # MCP servers this Agent can use
            functions=[wait_function], # Register the wait function as a tool
        )
        
        async with agent:
            # Automatically initializes the MCP servers and adds their tools for LLM use
            tools = await agent.list_tools()
            logger.info("Tools available:", data=tools)

            # Attach an OpenAI LLM to the agent
            # Model is specified in `mcp_agent.config.py`
            llm = await agent.attach_llm(OpenAIAugmentedLLM)

            # Agent's memory and notes
            agent_memory = {
                "moves_history": [],
                "notes": ""
            }
            
            # Load previous memory if it exists
            memory_path = Path(STATE_FILE)
            if memory_path.exists():
                try:
                    with open(memory_path, 'r') as f:
                        agent_memory = json.load(f)
                    logger.info("Loaded existing agent memory")
                except Exception as e:
                    logger.error(f"Error loading agent memory: {e}")
            
            # Game loop
            # while True:
            # Determine prompt based on whether this is the first turn
            if not agent_memory["moves_history"]:
                prompt = INITIAL_PROMPT
            else:
                prompt = TURN_PROMPT
            
            # Add agent's own notes and recent history to the prompt
            if agent_memory["notes"]:
                prompt += f"\n\n## Your Notes\n{agent_memory['notes']}\n"
            
            # Add recent move history (last 5 moves)
            if agent_memory["moves_history"]:
                prompt += "\n## Your Recent Moves\n"
                for i, move in enumerate(agent_memory["moves_history"][-5:]):
                    prompt += f"Move {len(agent_memory['moves_history']) - 5 + i + 1}: {move}\n"
            
            # Generate response
            logger.info("Generating next move")
            response = await llm.generate_str(
                message=prompt,
                request_params=RequestParams(
                    maxTokens=32000
                )
            )
            
            # Calculate move number
            move_number = len(agent_memory["moves_history"]) + 1
            
            # Log the response to file
            log_to_file(response, move_number)
            
            # Extract notes from the response (if the agent formats them)
            # This is a simple implementation - the agent needs to format notes consistently
            if "## Notes" in response:
                notes_section = response.split("## Notes")[1].split("##")[0].strip()
                agent_memory["notes"] = notes_section
            
            # Save the move to history
            agent_memory["moves_history"].append(response)
            
            # Save memory after each move
            try:
                with open(memory_path, 'w') as f:
                    json.dump(agent_memory, f, indent=2)
            except Exception as e:
                logger.error(f"Error saving agent memory: {e}")
            
            # Log the agent's response
            logger.info(f"Agent response: {response}")


if __name__ == "__main__":
    asyncio.run(run())
