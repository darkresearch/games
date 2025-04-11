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
        {
          uri: "/planets",
          mimeType: "application/json",
          name: "Discovered Planets",
          description: "List of planets discovered by a specific player"
        }
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
      
      case "/planets": {
        logger.debug("Processing planets request");
        if (!playerAddress) {
          logger.debug("No player address provided");
          throw new Error("Player address is required to list discovered planets");
        }

        logger.debug(`Getting planets for player: ${playerAddress}`);
        const gameManager = await playerRegistry.getOrCreatePlayer(playerAddress as EthAddress);
        const discoveredPlanets = await gameManager.getDiscoveredPlanets();
        logger.debug(`Found planets: ${discoveredPlanets.length}`);

        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(discoveredPlanets)
          }]
        };
      }

      default:
        logger.debug(`Unknown resource: ${pathname}`);
        throw new Error(`Unknown resource: ${pathname}`);
    }
  });
} 