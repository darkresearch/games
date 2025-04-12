import { PlayerRegistry } from "../../core/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress } from "@darkforest_eth/types";
import { MineChunkSchema } from '../../schemas/tools/miner';
import * as logger from '../../helpers/logger';

/**
 * Handles all mining-related tool requests
 */
export async function setupMinerHandlers(playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "mine_chunk": {
      const validatedArgs = MineChunkSchema.parse(args);
      const { address, x, y } = validatedArgs;
      const sideLength = 16; // Fixed chunk size
      
      logger.debug(`Mining chunk at (${x}, ${y}) with side length ${sideLength}`);

      try {
        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const miningService = gameManager.getMiningService();

        const chunk = await miningService.mineChunk(
          address as EthAddress,
          { x, y },
          sideLength
        );

        if (chunk) {
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
                chunkFootprint: chunk.chunkFootprint,
                planetLocations: chunk.planetLocations,
                perlin: chunk.perlin
              })
            }]
          };
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                chunk: null,
                planetLocations: [],
              })
            }]
          };
        }

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
    }

    default:
      throw new Error(`Unknown mining tool: ${request.params.name}`);
  }
} 