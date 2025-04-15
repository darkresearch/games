import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as logger from '../../helpers/logger';
import { resourceSchemas } from '../../schemas/resources';

// Import all handlers
import { setupPingHandlers } from './ping';
import { setupPlayerResourceHandlers } from './player';
import { setupPlanetResourceHandlers } from './planet';

/**
 * Sets up all resource handlers on the server
 */
export function setupResourceHandlers(server: Server, playerRegistry: PlayerRegistry) {
  // Set up the ListResources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.info("Listing resources");
    return { resources: resourceSchemas };
  });

  // Set up the ReadResource handler that routes to specific handlers
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    logger.info(`Read resource request: ${request.params.uri}`);
    
    // Route to appropriate handler based on resource URI
    if (request.params.uri === "df:/ping") {
      return setupPingHandlers(request);
    }
    
    if (request.params.uri === "df:/players" || request.params.uri === "df:/player/location") {
      return setupPlayerResourceHandlers(playerRegistry, request);
    }
    
    // Check if this is a planet resource request
    if (request.params.uri.startsWith("df:/planet/")) {
      return setupPlanetResourceHandlers(playerRegistry, request);
    }

    logger.debug(`Unknown resource: ${request.params.uri}`);
    throw new Error(`Unknown resource: ${request.params.uri}`);
  });
} 