import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import { EthAddress } from "@darkforest_eth/types";

export function setupResourceHandlers(server: Server, playerRegistry: PlayerRegistry) {
  /**
   * List available game resources
   */
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    console.log("Listing resources");
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
    console.log("Read resource request:", request.params.uri);
    
    let pathname;
    let searchParams = new URLSearchParams();
    
    try {
      // Try to parse as a complete URL
      const url = new URL(request.params.uri);
      pathname = url.pathname;
      searchParams = url.searchParams;
      console.log("Successfully parsed URL, pathname:", pathname);
    } catch (error: unknown) {
      // If it fails, treat the URI as a simple path
      console.log("Error parsing URL:", error instanceof Error ? error.message : String(error));
      pathname = request.params.uri;
      // For simple paths, there are no search params to parse
    }
    
    const playerAddress = searchParams.get('player');
    console.log("Player address:", playerAddress);
    
    // Handle the resource based on the pathname
    console.log("Handling pathname:", pathname);
    
    switch (pathname) {
      case "/ping": {
        console.log("Returning pong");
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "text/plain",
            text: "pong"
          }]
        };
      }
      
      case "/players": {
        console.log("Returning players list");
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
        console.log("Processing planets request");
        if (!playerAddress) {
          console.log("No player address provided");
          throw new Error("Player address is required to list discovered planets");
        }

        console.log("Getting planets for player:", playerAddress);
        const gameManager = await playerRegistry.getOrCreatePlayer(playerAddress as EthAddress);
        const discoveredPlanets = await gameManager.getDiscoveredPlanets();
        console.log("Found planets:", discoveredPlanets.length);

        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(discoveredPlanets)
          }]
        };
      }

      default:
        console.log("Unknown resource:", pathname);
        throw new Error(`Unknown resource: ${pathname}`);
    }
  });
} 