import { minerSchemas } from './minerSchemas';

/**
 * All tool schemas for the MCP
 */
export const toolSchemas = [
  {
    name: "generatePubkey",
    description: "Generate a new Ethereum address for the agent to use with Dark Forest MCP",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  // Mining schemas are now imported from minerSchemas.ts
  ...minerSchemas,
  {
    name: "init_player",
    description: "Initialize a new player",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "move",
    description: "Move from one planet to another",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        fromId: {
          type: "string",
          description: "Source planet ID"
        },
        toId: {
          type: "string", 
          description: "Destination planet ID"
        },
        forces: {
          type: "number",
          description: "Amount of forces to send"
        },
        silver: {
          type: "number",
          description: "Amount of silver to send"
        }
      },
      required: ["address", "fromId", "toId", "forces"]
    }
  },
  {
    name: "get_planet",
    description: "Get information about a planet",
    inputSchema: {
      type: "object",
      properties: {
        planetId: {
          type: "string",
          description: "Planet ID to get information about"
        }
      },
      required: ["planetId"]
    }
  },
  {
    name: "get_player",
    description: "Get information about a player",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "reveal_location",
    description: "Reveal a planet's location",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to reveal"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "upgrade_planet",
    description: "Upgrade a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to upgrade"
        },
        branch: {
          type: "number",
          description: "Upgrade branch (0: Defense, 1: Range, 2: Speed)"
        }
      },
      required: ["address", "planetId", "branch"]
    }
  },
  {
    name: "buy_hat",
    description: "Buy a hat for a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to buy hat for"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "deposit_artifact",
    description: "Deposit an artifact on a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to deposit artifact on"
        },
        artifactId: {
          type: "string",
          description: "ID of the artifact to deposit"
        }
      },
      required: ["address", "locationId", "artifactId"]
    }
  },
  {
    name: "withdraw_artifact",
    description: "Withdraw an artifact from a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to withdraw artifact from"
        },
        artifactId: {
          type: "string",
          description: "ID of the artifact to withdraw"
        }
      },
      required: ["address", "locationId", "artifactId"]
    }
  },
  {
    name: "activate_artifact",
    description: "Activate an artifact on a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID where artifact is located"
        },
        artifactId: {
          type: "string",
          description: "ID of the artifact to activate"
        },
        wormholeTo: {
          type: "string",
          description: "Optional: Planet ID to create wormhole to"
        }
      },
      required: ["address", "locationId", "artifactId"]
    }
  },
  {
    name: "withdraw_silver",
    description: "Withdraw silver from a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to withdraw silver from"
        },
        amount: {
          type: "number",
          description: "Amount of silver to withdraw"
        }
      },
      required: ["address", "locationId", "amount"]
    }
  },
  {
    name: "deactivate_artifact",
    description: "Deactivate an artifact on a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID where artifact is located"
        }
      },
      required: ["address", "locationId"]
    }
  },
  {
    name: "prospect_planet",
    description: "Prospect a planet for artifacts",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to prospect"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "find_artifact",
    description: "Find an artifact on a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to find artifact on"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "get_artifact",
    description: "Get information about an artifact",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        artifactId: {
          type: "string",
          description: "Artifact ID to get information about"
        }
      },
      required: ["address", "artifactId"]
    }
  },
  {
    name: "get_my_artifacts",
    description: "Get all artifacts owned by the player",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_all_players",
    description: "Get information about all players",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address for authentication"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_twitter",
    description: "Get a player's Twitter handle",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        playerAddress: {
          type: "string",
          description: "Address of the player to get Twitter for"
        }
      },
      required: ["address", "playerAddress"]
    }
  },
  {
    name: "get_player_score",
    description: "Get a player's score",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        playerAddress: {
          type: "string",
          description: "Address of the player to get score for"
        }
      },
      required: ["address", "playerAddress"]
    }
  },
  {
    name: "get_energy_of_player",
    description: "Get a player's total energy",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        playerAddress: {
          type: "string",
          description: "Address of the player to get energy for"
        }
      },
      required: ["address", "playerAddress"]
    }
  },
  {
    name: "get_silver_of_player",
    description: "Get a player's total silver",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        playerAddress: {
          type: "string",
          description: "Address of the player to get silver for"
        }
      },
      required: ["address", "playerAddress"]
    }
  },
  {
    name: "get_world_radius",
    description: "Get the radius of the game world",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address for authentication"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_hash_config",
    description: "Get the hash configuration",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_captured_planets",
    description: "Get all captured planets",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "invade_planet",
    description: "Invade a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to invade"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "capture_planet",
    description: "Capture a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to capture"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "claim_victory",
    description: "Claim victory in the game",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_dist",
    description: "Get distance between two planets",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        fromId: {
          type: "string",
          description: "Source planet ID"
        },
        toId: {
          type: "string",
          description: "Destination planet ID"
        }
      },
      required: ["address", "fromId", "toId"]
    }
  },
  {
    name: "get_max_move_dist",
    description: "Get maximum move distance for a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to check"
        },
        sendingPercent: {
          type: "number",
          description: "Percentage of forces to send"
        },
        abandoning: {
          type: "boolean",
          description: "Whether the planet is being abandoned"
        }
      },
      required: ["address", "planetId", "sendingPercent"]
    }
  },
  {
    name: "get_energy_needed_for_move",
    description: "Calculate energy needed for a move",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        fromId: {
          type: "string",
          description: "Source planet ID"
        },
        toId: {
          type: "string",
          description: "Destination planet ID"
        },
        arrivingEnergy: {
          type: "number",
          description: "Energy to arrive with"
        },
        abandoning: {
          type: "boolean",
          description: "Whether the planet is being abandoned"
        }
      },
      required: ["address", "fromId", "toId", "arrivingEnergy"]
    }
  },
  {
    name: "get_time_for_move",
    description: "Calculate time for a move",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        fromId: {
          type: "string",
          description: "Source planet ID"
        },
        toId: {
          type: "string",
          description: "Destination planet ID"
        },
        abandoning: {
          type: "boolean",
          description: "Whether the planet is being abandoned"
        }
      },
      required: ["address", "fromId", "toId"]
    }
  },
  {
    name: "get_planets_in_range",
    description: "Get planets within range of a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to check"
        },
        sendingPercent: {
          type: "number",
          description: "Percentage of forces to send"
        },
        abandoning: {
          type: "boolean",
          description: "Whether the planet is being abandoned"
        }
      },
      required: ["address", "planetId", "sendingPercent"]
    }
  },
  {
    name: "get_end_time_seconds",
    description: "Get game end time in seconds",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_token_mint_end_time_seconds",
    description: "Get token mint end time in seconds",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "start_explore",
    description: "Start the exploration/mining process",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "stop_explore",
    description: "Stop the exploration/mining process",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "set_miner_cores",
    description: "Set the number of cores to use for mining",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        cores: {
          type: "number",
          description: "Number of cores to use"
        }
      },
      required: ["address", "cores"]
    }
  },
  {
    name: "is_mining",
    description: "Check if mining is active",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_current_exploring_chunk",
    description: "Get the chunk currently being explored",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_explored_chunks",
    description: "Get all explored chunks",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "has_mined_chunk",
    description: "Check if a chunk has been mined",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        chunkX: {
          type: "number",
          description: "Chunk X coordinate"
        },
        chunkY: {
          type: "number",
          description: "Chunk Y coordinate"
        },
        sideLength: {
          type: "number",
          description: "Side length of the chunk"
        }
      },
      required: ["address", "chunkX", "chunkY", "sideLength"]
    }
  },
  {
    name: "get_planets_in_world_rectangle",
    description: "Get planets in a rectangular area of the world",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        worldX: {
          type: "number",
          description: "X coordinate of rectangle top-left"
        },
        worldY: {
          type: "number",
          description: "Y coordinate of rectangle top-left"
        },
        worldWidth: {
          type: "number",
          description: "Width of rectangle"
        },
        worldHeight: {
          type: "number",
          description: "Height of rectangle"
        },
        levels: {
          type: "array",
          items: {
            type: "number"
          },
          description: "Planet levels to include"
        }
      },
      required: ["address", "worldX", "worldY", "worldWidth", "worldHeight"]
    }
  },
  {
    name: "get_my_planets",
    description: "Get all planets owned by the player",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_all_target_planets",
    description: "Get all target planets in the game",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_player_target_planets",
    description: "Get all target planets owned by a player",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        playerAddress: {
          type: "string",
          description: "Address of the player to get targets for"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_all_blocks",
    description: "Get all movement blocks in the game",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_all_voyages",
    description: "Get all active voyages",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_unconfirmed_moves",
    description: "Get all unconfirmed moves",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_unconfirmed_upgrades",
    description: "Get all unconfirmed upgrades",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_home_coords",
    description: "Get the coordinates of the player's home planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_revealed_locations",
    description: "Get all revealed locations",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_claimed_locations",
    description: "Get all claimed locations",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "submit_verify_twitter",
    description: "Verify a player's Twitter account",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        twitter: {
          type: "string",
          description: "Twitter handle to verify"
        }
      },
      required: ["address", "twitter"]
    }
  },
  {
    name: "set_planet_emoji",
    description: "Set an emoji for a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to set emoji for"
        },
        emojiStr: {
          type: "string",
          description: "Emoji to set"
        }
      },
      required: ["address", "locationId", "emojiStr"]
    }
  },
  {
    name: "clear_emoji",
    description: "Clear emoji from a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to clear emoji from"
        }
      },
      required: ["address", "locationId"]
    }
  },
  {
    name: "is_game_over",
    description: "Check if the game is over",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_winners",
    description: "Get the winners of the game",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "is_admin",
    description: "Check if a player is an admin",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        playerAddress: {
          type: "string",
          description: "Address to check admin status for"
        }
      },
      required: ["address", "playerAddress"]
    }
  },
  {
    name: "is_competitive",
    description: "Check if the game is competitive",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_teams_enabled",
    description: "Check if teams are enabled",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "get_capture_zones",
    description: "Get all current capture zones in the universe",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address for authentication"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "is_planet_in_capture_zone",
    description: "Check if a planet is within any capture zone",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "ID of the planet to check"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "get_next_capture_zone_change",
    description: "Get information about when capture zones will next change",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address for authentication"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "invade_planet",
    description: "Start invasion of a planet in a capture zone",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "ID of the planet to invade"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "capture_planet",
    description: "Capture a planet after successful invasion in a capture zone",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "ID of the planet to capture"
        }
      },
      required: ["address", "planetId"]
    }
  }
]; 