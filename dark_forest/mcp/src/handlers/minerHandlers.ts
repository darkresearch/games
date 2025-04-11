import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import { MineChunkSchema } from '../types/minerSchemas';
import { EthAddress, LocationId } from "@darkforest_eth/types";
import * as logger from '../helpers/logger';
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

/**
 * Setup mining-related tool handler
 */
export function setupMinerHandlers(server: Server, playerRegistry: PlayerRegistry) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Only handle mine_chunk requests
    if (request.params.name !== "mine_chunk") {
      throw new Error("Unknown tool");
    }

    const args = request.params.arguments || {};
    const validatedArgs = MineChunkSchema.parse(args);
    const { address, x, y } = validatedArgs;
    const sideLength = 16; // Fixed chunk size
    
    logger.debug(`Mining chunk at (${x}, ${y}) with side length ${sideLength}`);
    
    try {
      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const miningService = gameManager.getMiningService();
      
      // Mine the chunk at the specified coordinates
      const chunk = await miningService.mineChunk(
        address as EthAddress,
        { x, y },
        sideLength
      );
      
      // Return the results
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            chunk: {
              x,
              y,
              sideLength
            },
            planetLocations: chunk ? chunk.planetLocations : []
          })
        }]
      };
    } catch (error) {
      logger.error(`Error mining chunk: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
        }]
      };
    }
  });
} 