import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress, LocationId } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';

/**
 * Handles all planet-related tool requests
 */
export async function setupPlanetHandlers(server: Server, playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "move": {
      const address = args.address as string;
      const fromId = args.fromId as string;
      const toId = args.toId as string;

      const fromX = Number(args.fromX);
      const fromY = Number(args.fromY);
      
      const toX = Number(args.toX);
      const toY = Number(args.toY);

      const forces = Number(args.forces);
      const silver = Number(args.silver || 0);

      if (!address || !fromId || !toId || isNaN(forces)) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.move(fromId as LocationId, toId as LocationId, fromX, fromY, toX, toY, forces, silver);
      
      logger.debug(`Moved successfully: ${JSON.stringify(tx)}`);

      return {
        content: [{
          type: "text",
          text: `Move initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    default:
      throw new Error(`Unknown planet tool: ${request.params.name}`);
  }
} 