#!/usr/bin/env node

/**
 * Dark Forest MCP Server
 * Exposes Dark Forest game functionality through the Model Context Protocol
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Request,
} from "@modelcontextprotocol/sdk/types.js";
import { EthConnection } from "@darkforest_eth/network";
import { EthAddress, Player, Planet, LocationId, ArtifactId } from "@darkforest_eth/types";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { providers } from "ethers";
import { GameManager } from "./GameManager";

/**
 * Manages GameManager instances for each player
 */
class PlayerRegistry {
  private players: Map<EthAddress, GameManager> = new Map();
  private ethConnection: EthConnection;
  private contractAddress: EthAddress;

  constructor(contractAddress: EthAddress) {
    this.contractAddress = contractAddress;
    
    // Initialize EthConnection
    const provider = new providers.JsonRpcProvider("http://localhost:8545"); // TODO: Make configurable
    this.ethConnection = new EthConnection(provider, 1); // Using mainnet network ID
  }

  async getOrCreatePlayer(address: EthAddress): Promise<GameManager> {
    let player = this.players.get(address);
    if (!player) {
      // Create new GameManager instance
      player = await GameManager.create({
        connection: this.ethConnection,
        contractAddress: this.contractAddress,
        account: address,
      });

      this.players.set(address, player);
    }
    return player;
  }

  getPlayer(address: EthAddress): GameManager | undefined {
    return this.players.get(address);
  }

  removePlayer(address: EthAddress): void {
    const player = this.players.get(address);
    if (player) {
      player.destroy();
      this.players.delete(address);
    }
  }
}

// Create registry instance
const playerRegistry = new PlayerRegistry("0x0000000000000000000000000000000000000000" as EthAddress); // TODO: Set proper contract address

/**
 * Create MCP server with capabilities for resources and tools
 */
const server = new Server(
  {
    name: "Dark Forest MCP",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * List available game resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "darkforest://players",
        mimeType: "application/json",
        name: "Players",
        description: "List of all players in the game"
      },
      {
        uri: "darkforest://planets",
        mimeType: "application/json",
        name: "Planets",
        description: "List of all discovered planets"
      }
    ]
  };
});

/**
 * Read game resources
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  
  switch (url.pathname) {
    case "/players": {
      // TODO: Implement proper player listing
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify([])
        }]
      };
    }
    
    case "/planets": {
      // TODO: Implement proper planet listing
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify([])
        }]
      };
    }

    default:
      throw new Error(`Unknown resource: ${url.pathname}`);
  }
});

/**
 * List available game tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
        name: "join_game",
        description: "Join the game with a team",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Player's Ethereum address"
            },
            team: {
              type: "number",
              description: "Team number to join",
              default: 0
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
            },
            artifactId: {
              type: "string",
              description: "ID of the artifact to deactivate"
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
        name: "prospect_planet",
        description: "Prospect a planet for artifacts",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Player's Ethereum address"
            },
            locationId: {
              type: "string",
              description: "Planet ID to prospect"
            }
          },
          required: ["address", "locationId"]
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
        name: "get_artifacts",
        description: "Get artifacts owned by a player",
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
        name: "get_planets_in_range",
        description: "Get planets within range of a source planet",
        inputSchema: {
          type: "object",
          properties: {
            planetId: {
              type: "string",
              description: "Source planet ID"
            },
            sendingPercent: {
              type: "number",
              description: "Percentage of energy to send"
            }
          },
          required: ["planetId", "sendingPercent"]
        }
      }
    ]
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "init_player": {
      const args = request.params.arguments || {};
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      
      // Generate random coordinates for initialization
      const x = Math.floor(Math.random() * 10000);
      const y = Math.floor(Math.random() * 10000);
      const r = Math.floor(Math.random() * 10000);
      const f = Math.floor(Math.random() * 10000);
      
      await gameManager.initializePlayer(x, y, r, f);

      return {
        content: [{
          type: "text",
          text: "Player initialized"
        }]
      };
    }

    case "join_game":
      throw new Error("Tool not implemented");

    case "move": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const fromId = args.fromId as string;
      const toId = args.toId as string;
      const forces = args.forces as number;
      const silver = (args.silver as number) || 0;

      if (!address || !fromId || !toId || typeof forces !== 'number') {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.move(fromId as LocationId, toId as LocationId, forces, silver);

      return {
        content: [{
          type: "text",
          text: `Move initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "get_planet": {
      const args = request.params.arguments || {};
      const planetId = args.planetId as string;

      if (!planetId) {
        throw new Error("Planet ID is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(EMPTY_ADDRESS);
      const planet = await gameManager.getPlanet(planetId as LocationId);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(planet)
        }]
      };
    }

    case "get_player": {
      const args = request.params.arguments || {};
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(EMPTY_ADDRESS);
      const player = await gameManager.getPlayer(address as EthAddress);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(player)
        }]
      };
    }

    case "reveal_location": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      
      // Generate coordinates for reveal
      const x = Math.floor(Math.random() * 10000);
      const y = Math.floor(Math.random() * 10000);
      const r = Math.floor(Math.random() * 10000);
      
      const tx = await gameManager.revealLocation(planetId as LocationId, x, y, r);

      return {
        content: [{
          type: "text",
          text: `Location reveal initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "upgrade_planet": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const planetId = args.planetId as string;
      const branch = args.branch as number;

      if (!address || !planetId || typeof branch !== 'number') {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.upgrade(planetId as LocationId, branch);

      return {
        content: [{
          type: "text",
          text: `Planet upgrade initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "buy_hat": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.buyHat(planetId as LocationId);

      return {
        content: [{
          type: "text",
          text: `Hat purchase initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "find_artifact":
    case "deactivate_artifact":
    case "prospect_planet":
    case "claim_victory":
    case "get_artifacts":
    case "get_planets_in_range":
      throw new Error("Tool not implemented");

    case "deposit_artifact": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const locationId = args.locationId as string;
      const artifactId = args.artifactId as string;

      if (!address || !locationId || !artifactId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.depositArtifact(locationId as LocationId, artifactId as ArtifactId);

      return {
        content: [{
          type: "text",
          text: `Artifact deposit initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "withdraw_artifact": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const locationId = args.locationId as string;
      const artifactId = args.artifactId as string;

      if (!address || !locationId || !artifactId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.withdrawArtifact(locationId as LocationId, artifactId as ArtifactId);

      return {
        content: [{
          type: "text",
          text: `Artifact withdrawal initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "activate_artifact": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const locationId = args.locationId as string;
      const artifactId = args.artifactId as string;
      const wormholeTo = args.wormholeTo as string;

      if (!address || !locationId || !artifactId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.activateArtifact(
        locationId as LocationId,
        artifactId as ArtifactId,
        wormholeTo as LocationId
      );

      return {
        content: [{
          type: "text",
          text: `Artifact activation initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "withdraw_silver": {
      const args = request.params.arguments || {};
      const address = args.address as string;
      const locationId = args.locationId as string;
      const amount = args.amount as number;

      if (!address || !locationId || typeof amount !== 'number') {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.withdrawSilver(locationId as LocationId, amount);

      return {
        content: [{
          type: "text",
          text: `Silver withdrawal initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
