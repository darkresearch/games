import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import { EthAddress } from "@darkforest_eth/types";
import * as logger from '../helpers/logger';

export function setupResourceHandlers(server: Server, playerRegistry: PlayerRegistry) {
  /**
   * List available game resources
   */
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.info("Listing resources");
    return {
      resources: [
        {
          uri: "/ping",
          mimeType: "text/plain",
          name: "Ping",
          description: "Simple ping/pong test resource"
        },
        {
          uri: "/players",
          mimeType: "application/json",
          name: "Players",
          description: "List of all players in the game"
        },
        // TODO: Implement this later
        // {
        //   uri: "/discoveredPlanets",
        //   mimeType: "application/json",
        //   name: "Agent Discovered Planets",
        //   description: "List of planets discovered by a specific agent through mining"
        // }
      ]
    };
  });

  /**
   * Read game resources
   */
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    logger.info(`Read resource request: ${request.params.uri}`);
    
    let pathname;
    let searchParams = new URLSearchParams();
    
    try {
      // Try to parse as a complete URL
      const url = new URL(request.params.uri);
      pathname = url.pathname;
      searchParams = url.searchParams;
      logger.debug(`Successfully parsed URL, pathname: ${pathname}`);
    } catch (error: unknown) {
      // If it fails, treat the URI as a simple path
      logger.debug(`Error parsing URL: ${error instanceof Error ? error.message : String(error)}`);
      pathname = request.params.uri;
      // For simple paths, there are no search params to parse
    }
    
    const playerAddress = searchParams.get('player');
    logger.debug(`Player address: ${playerAddress}`);
    
    // Handle the resource based on the pathname
    logger.debug(`Handling pathname: ${pathname}`);
    
    switch (pathname) {
      case "/ping": {
        logger.debug("Returning pong");
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "text/plain",
            text: "pong"
          }]
        };
      }
      
      case "/players": {
        logger.debug("Returning players list");
        // TODO: Implement proper player listing
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify([])
          }]
        };
      }

      // TODO: Implement this later
      // case "/discoveredPlanets": {
      //   logger.debug("Processing discovered planets request");
      //   if (!playerAddress) {
      //     logger.debug("No player address provided");
      //     throw new Error("Player address is required to list discovered planets");
      //   }

      //   logger.debug(`Getting discovered planets for agent: ${playerAddress}`);
      //   const planetIds = playerRegistry.getDiscoveredPlanets(playerAddress as EthAddress);
      //   logger.debug(`Found discovered planets: ${planetIds.length}`);

      //   return {
      //     contents: [{
      //       uri: request.params.uri,
      //       mimeType: "application/json",
      //       text: JSON.stringify(planetIds)
      //     }]
      //   };
      // }

      default:
        logger.debug(`Unknown resource: ${pathname}`);
        throw new Error(`Unknown resource: ${pathname}`);
    }
  });
} 