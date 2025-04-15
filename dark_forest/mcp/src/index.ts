#!/usr/bin/env node

/**
 * Dark Forest MCP Server
 * Exposes Dark Forest game functionality through the Model Context Protocol
 */

import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { PlayerRegistry } from "./core/PlayerRegistry";
import { setupToolHandlers } from "./handlers/tools/index";
import { EthAddress } from "@darkforest_eth/types";
import { CONTRACT_ADDRESS, NETWORK_ID } from "@darkforest_eth/contracts";
import * as logger from './helpers/logger';

// Extend global object to include playerRegistry
declare global {
  var playerRegistry: PlayerRegistry;
}

// Get game-specific public key from environment variable
const gamePubkey = (process.env.GAME_PUBKEY || EMPTY_ADDRESS) as EthAddress;
if (gamePubkey === EMPTY_ADDRESS) {
  logger.warn("Warning: Using empty address for game public key. Set GAME_PUBKEY environment variable to specify the game instance.");
}

// Base Dark Forest contract address from the contracts package
const baseContractAddress = CONTRACT_ADDRESS as EthAddress;

// Get network ID from environment variable or contracts package
const networkId = parseInt(process.env.DARK_FOREST_NETWORK_ID || NETWORK_ID.toString() || "1", 10);

// Create registry instance with game pubkey, base contract address and network ID
const playerRegistry = new PlayerRegistry(gamePubkey, baseContractAddress, networkId);

// Make playerRegistry available globally for access by GameManager
global.playerRegistry = playerRegistry;

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
setupToolHandlers(server, playerRegistry);

// Create Express app
const app = express();

// To support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: {[sessionId: string]: SSEServerTransport} = {};

// SSE endpoint for establishing connections
app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
    logger.info(`Client disconnected: ${transport.sessionId}`);
  });
  await server.connect(transport);
  logger.info(`New client connected: ${transport.sessionId}`);
});

// Message endpoint for receiving client messages
app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

/**
 * Start the server
 */
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  app.listen(port, () => {
    logger.info("Dark Forest MCP Server started");
    logger.info(`Listening on port ${port}`);
    logger.info(`Game Public Key: ${gamePubkey}`);
    logger.info(`Base Contract Address: ${baseContractAddress}`);
  });
}

main().catch((error) => {
  logger.error(`Server error: ${logger.formatError(error)}`);
  process.exit(1);
});
