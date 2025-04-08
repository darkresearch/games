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

// Get contract address from environment variable
const contractAddress = (process.env.DARK_FOREST_CONTRACT_ADDRESS || EMPTY_ADDRESS) as EthAddress;
if (contractAddress === EMPTY_ADDRESS) {
  console.warn("Warning: Using empty address for Dark Forest contract. Set DARK_FOREST_CONTRACT_ADDRESS environment variable.");
}

// Create registry instance
const playerRegistry = new PlayerRegistry(contractAddress);

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
