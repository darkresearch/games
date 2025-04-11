#!/usr/bin/env node

/**
 * Dark Forest MCP Server
 * Exposes Dark Forest game functionality through the Model Context Protocol
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { PlayerRegistry } from "./registry/PlayerRegistry";
import { setupResourceHandlers } from "./handlers/resourceHandlers";
import { setupToolHandlers } from "./handlers/toolHandlers";
import { EthAddress } from "@darkforest_eth/types";
import { CONTRACT_ADDRESS, NETWORK_ID } from "@darkforest_eth/contracts";

// Get game-specific public key from environment variable
const gamePubkey = (process.env.GAME_PUBKEY || EMPTY_ADDRESS) as EthAddress;
if (gamePubkey === EMPTY_ADDRESS) {
  console.warn("Warning: Using empty address for game public key. Set GAME_PUBKEY environment variable to specify the game instance.");
}

// Base Dark Forest contract address from the contracts package
const baseContractAddress = CONTRACT_ADDRESS as EthAddress;

// Get network ID from environment variable or contracts package
const networkId = parseInt(process.env.DARK_FOREST_NETWORK_ID || NETWORK_ID.toString() || "1", 10);

// Create registry instance with game pubkey, base contract address and network ID
const playerRegistry = new PlayerRegistry(gamePubkey, baseContractAddress, networkId);

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

// Set up handlers
setupResourceHandlers(server, playerRegistry);
setupToolHandlers(server, playerRegistry);

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("Dark Forest MCP Server started");
  console.log("Game Public Key:", gamePubkey);
  console.log("Base Contract Address:", baseContractAddress);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
