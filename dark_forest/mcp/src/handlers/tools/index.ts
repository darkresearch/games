import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolSchemas } from "../../schemas/tools";

// Import all handlers
import { setupMinerHandlers } from './miner';
import { setupPlayerHandlers } from './player';
import { setupPlanetHandlers } from './planet';
import { setupPingHandlers } from './ping';

/**
 * Sets up all tool handlers on the server
 */
export function setupToolHandlers(server: Server, playerRegistry: PlayerRegistry) {
  // Set up the ListTools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {    
    return { tools: toolSchemas };
  });

  // Set up the CallTool handler that routes to specific handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    
    // Route to appropriate handler based on tool name
    switch (toolName) {
      // Ping tool
      case "ping":
        return setupPingHandlers(request);

      // Mining tools
      case "mine_chunk":
        return setupMinerHandlers(playerRegistry, request);

      // Player tools
      case "generate_pubkey":
      case "init_player":
      case "update_location":
      case "player_location":
          return setupPlayerHandlers(server, playerRegistry, request);

      // Planet tools  
      case "move":
      case "planet":
      case "planet_movetime":
      case "planet_maxmovedist":
        return setupPlanetHandlers(server, playerRegistry, request);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  });
} 