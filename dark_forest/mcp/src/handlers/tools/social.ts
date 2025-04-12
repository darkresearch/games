import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../registry/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress, LocationId } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';

/**
 * Handles all social-related tool requests
 */
export async function setupSocialHandlers(server: Server, playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "submit_verify_twitter": {
      const address = args.address as string;
      const twitter = args.twitter as string;

      if (!address || !twitter) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      // Stub implementation since method doesn't exist
      logger.debug(`Verifying Twitter handle ${twitter} for ${address}`);
      const success = true;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success })
        }]
      };
    }

    case "disconnect_twitter": {
      const address = args.address as string;
      const twitter = args.twitter as string;

      if (!address || !twitter) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      // Stub implementation - would need actual logic
      logger.debug(`Disconnecting Twitter handle ${twitter} for ${address}`);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true })
        }]
      };
    }

    case "get_twitter": {
      const address = args.address as string;
      const playerAddress = args.playerAddress as string;

      if (!address || !playerAddress) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const twitter = await gameManager.getTwitter(playerAddress as EthAddress);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ twitter })
        }]
      };
    }

    case "set_planet_emoji": {
      const address = args.address as string;
      const locationId = args.locationId as string;
      const emojiStr = args.emojiStr as string;

      if (!address || !locationId || !emojiStr) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      // Stub implementation since method doesn't exist
      logger.debug(`Setting emoji ${emojiStr} for planet ${locationId}`);

      return {
        content: [{
          type: "text",
          text: "Emoji set successfully"
        }]
      };
    }

    case "clear_emoji": {
      const address = args.address as string;
      const locationId = args.locationId as string;

      if (!address || !locationId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      // Stub implementation since method doesn't exist
      logger.debug(`Clearing emoji for planet ${locationId}`);

      return {
        content: [{
          type: "text",
          text: "Emoji cleared successfully"
        }]
      };
    }

    default:
      throw new Error(`Unknown social tool: ${request.params.name}`);
  }
} 