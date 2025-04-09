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

// Get contract address from environment variable or contracts package
const contractAddress = (process.env.DARK_FOREST_CONTRACT_ADDRESS || CONTRACT_ADDRESS || EMPTY_ADDRESS) as EthAddress;
if (contractAddress === EMPTY_ADDRESS) {
  console.warn("Warning: Using empty address for Dark Forest contract. Set DARK_FOREST_CONTRACT_ADDRESS environment variable or ensure contracts package is properly configured.");
}

// Get network ID from environment variable or contracts package
const networkId = parseInt(process.env.DARK_FOREST_NETWORK_ID || NETWORK_ID.toString() || "1", 10);

// Create registry instance with contract address and network ID
const playerRegistry = new PlayerRegistry(contractAddress, networkId);

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
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
