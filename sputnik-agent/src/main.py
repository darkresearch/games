"""SPUTNIK app definition using MCPApp."""

import asyncio
import json
import os
import datetime
from pathlib import Path
from supabase import create_client, Client
from typing import Optional
import logging

from mcp_agent.app import MCPApp
from mcp_agent.agents.agent import Agent
from mcp_agent.workflows.llm.augmented_llm import RequestParams
from mcp_agent.workflows.llm.augmented_llm_openai import OpenAIAugmentedLLM
from .utils import load_markdown_instructions, update_secrets_from_env

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Optional[Client] = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hardcoded values
INITIAL_PROMPT = """
Hello Player 0xDD8563f2B62f9c92891AB0d4Ef45350cFEa10Cc8, you are now playing the Dark Forest game. 

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
Hello Player 0xDD8563f2B62f9c92891AB0d4Ef45350cFEa10Cc8, this is your next turn in the Dark Forest game.

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

TIMEOUT_PROMPT = """
Hello Player 0xDD8563f2B62f9c92891AB0d4Ef45350cFEa10Cc8, your last turn timed out after 2 minutes.

This isn't necessarily a problem and might not be your fault - sometimes network delays or other external factors can cause this.
However, it's important to:
1. Note what action you were attempting when the timeout occurred
2. Be mindful if you see a pattern of timeouts with specific actions
3. Consider alternative strategies if you find yourself repeatedly stuck

Please proceed with your next move, keeping in mind what happened in your last turn.

Remember your mission is still to find the hidden target planet, and all the same game rules apply.
"""

AGENT_NAME = "SPUTNIK"
INSTRUCTION_FILE = "instructions.md"
STATE_FILE = "agent_state.json"
AGENT_LOG_FILE = "agent-output.log"
MAX_WAIT = 900  # 15 minutes, same as wait function
LLM_MAX_WAIT = 60

# Update `mcp_agent.secrets.yaml` from environment variables
update_secrets_from_env()

# Create the app
sputnik_app = MCPApp(name="sputnik", human_input_callback=None)

# Initialize logger at module level
logger = logging.getLogger("sputnik")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

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
    max_wait = MAX_WAIT  # 15 minutes
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

async def write_to_supabase(message: str, move_number: int, timestamp: datetime.datetime):
    """
    Write agent's thoughts to Supabase table.
    
    Args:
        message: The agent's response/thoughts
        move_number: Current move number
        timestamp: Timestamp of the move
    """
    if not supabase:
        return
        
    # Skip writing to Supabase if the message is empty
    if not message or message.strip() == "EMPTY":
        return
        
    try:
        data = {
            "move_number": move_number,
            "timestamp": timestamp.isoformat(),
            "content": message,
        }
        
        supabase.table("sputnik_thoughts").insert(data).execute()
    except Exception as e:
        logger.error(f"Error writing to Supabase: {e}")

async def run():
    # Track overall connection attempts
    connection_attempts = 0
    reconnect_delay = 5  # seconds
    
    while True:
        connection_attempts += 1
        logger.info(f"Starting connection attempt {connection_attempts}")
        
        try:
            async with sputnik_app.run() as app:
                context = app.context
                app_logger = app.logger  # Get app logger for internal operations

                app_logger.info(f"Starting SPUTNIK for Dark Forest game")
                app_logger.info("Current config:", data=context.config.model_dump())

                # Check Supabase connection
                if not supabase:
                    app_logger.warning("Supabase connection not configured. Thoughts will not be stored in database.")

                # Load instructions from markdown file, preserving formatting
                instructions = load_markdown_instructions(INSTRUCTION_FILE)

                agent = Agent(
                    name=AGENT_NAME,
                    instruction=instructions,
                    server_names=["solana", "dark_forest"],
                    functions=[wait_function],
                )
                
                async with agent:
                    tools = await agent.list_tools()
                    app_logger.info("Tools available:", data=tools)

                    llm = await agent.attach_llm(OpenAIAugmentedLLM)

                    agent_memory = {
                        "moves_history": [],
                        "notes": "",
                        "timeout_count": 0  # Track number of timeouts
                    }
                    
                    # Load previous memory if it exists
                    memory_path = Path(STATE_FILE)
                    if memory_path.exists():
                        try:
                            with open(memory_path, 'r') as f:
                                agent_memory = json.load(f)
                                # Ensure timeout_count exists in loaded memory
                                if "timeout_count" not in agent_memory:
                                    agent_memory["timeout_count"] = 0
                            app_logger.info("Loaded existing agent memory")
                        except Exception as e:
                            app_logger.error(f"Error loading agent memory: {e}")
                    
                    # Game loop
                    consecutive_timeouts = 0
                    max_consecutive_timeouts = 3  # Threshold to trigger reconnection
                    
                    while True:
                        # Determine prompt based on whether this is the first turn or after a timeout
                        if not agent_memory["moves_history"]:
                            prompt = INITIAL_PROMPT
                        elif agent_memory.get("last_turn_timeout", False):
                            prompt = TIMEOUT_PROMPT
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
                        
                        # Generate response with timeout
                        app_logger.info("Generating next move")
                        try:
                            response = await asyncio.wait_for(
                                llm.generate_str(
                                    message=prompt,
                                    request_params=RequestParams(maxTokens=16000)
                                ),
                                timeout=LLM_MAX_WAIT
                            )
                            agent_memory["last_turn_timeout"] = False
                            consecutive_timeouts = 0  # Reset consecutive timeouts counter
                        except asyncio.TimeoutError:
                            app_logger.warning(f"Turn timed out after {LLM_MAX_WAIT} seconds")
                            agent_memory["timeout_count"] += 1
                            agent_memory["last_turn_timeout"] = True
                            consecutive_timeouts += 1
                            response = "TIMEOUT: The previous LLM call exceeded the time limit."
                            
                            # If we hit consecutive timeouts threshold, break to reconnect
                            if consecutive_timeouts >= max_consecutive_timeouts:
                                app_logger.warning(f"Hit {consecutive_timeouts} consecutive timeouts. Reconnecting...")
                                break
                        except Exception as e:
                            app_logger.error(f"Error during turn: {e}")
                            response = f"ERROR: An unexpected error occurred: {str(e)}"
                            # For connection errors, break to reconnect
                            if "connection" in str(e).lower() or "timeout" in str(e).lower():
                                app_logger.warning("Detected connection error. Reconnecting...")
                                consecutive_timeouts += 1
                                if consecutive_timeouts >= max_consecutive_timeouts:
                                    break
                        
                        # Calculate move number and timestamp
                        move_number = len(agent_memory["moves_history"]) + 1
                        timestamp = datetime.datetime.now()
                        
                        # Log the response to file
                        log_to_file(response, move_number)
                        
                        # Write to Supabase
                        await write_to_supabase(response, move_number, timestamp)
                        
                        # Extract notes from the response (if the agent formats them)
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
                            app_logger.error(f"Error saving agent memory: {e}")
                        
                        # Log the agent's response
                        app_logger.info(f"Agent response: {response}")

                        # Sleep for 1 second between turns
                        await asyncio.sleep(10)
                    
                    # If we broke out of the game loop, we need to reconnect
                    app_logger.info("Exited game loop, will attempt to reconnect")
                    continue
                
        except Exception as e:
            logger.error(f"Error in connection: {e}")
        
        # Wait before reconnecting
        logger.info(f"Waiting {reconnect_delay} seconds before reconnecting...")
        await asyncio.sleep(reconnect_delay)
        # Increase reconnect delay with each attempt (exponential backoff)
        reconnect_delay = min(reconnect_delay * 2, 60)  # Cap at 60 seconds


if __name__ == "__main__":
    asyncio.run(run())