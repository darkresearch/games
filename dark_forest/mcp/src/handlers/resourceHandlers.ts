import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import { EthAddress } from "@darkforest_eth/types";

export function setupResourceHandlers(server: Server, playerRegistry: PlayerRegistry) {
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
    const url = new URL(request.params.uri);
    const searchParams = new URLSearchParams(url.search);
    const playerAddress = searchParams.get('player');
    
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
        if (!playerAddress) {
          throw new Error("Player address is required to list discovered planets");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(playerAddress as EthAddress);
        const discoveredPlanets = await gameManager.getDiscoveredPlanets();

        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(discoveredPlanets)
          }]
        };
      }

      default:
        throw new Error(`Unknown resource: ${url.pathname}`);
    }
  });
} 