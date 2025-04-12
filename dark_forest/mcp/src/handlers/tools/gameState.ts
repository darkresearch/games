import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../registry/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';

/**
 * Handles all game state-related tool requests
 */
export async function setupGameStateHandlers(server: Server, playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "get_world_radius": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const worldRadius = gameManager.getWorldRadius();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ worldRadius })
        }]
      };
    }

    case "get_hash_config": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const hashConfig = gameManager.getHashConfig();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(hashConfig)
        }]
      };
    }

    case "get_end_time_seconds": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const endTimeSeconds = await gameManager.getEndTimeSeconds();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ endTimeSeconds })
        }]
      };
    }

    case "get_token_mint_end_time_seconds": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tokenMintEndTimeSeconds = await gameManager.getTokenMintEndTimeSeconds();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ tokenMintEndTimeSeconds })
        }]
      };
    }

    case "is_game_over": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const isGameOver = await gameManager.isGameOver();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ isGameOver })
        }]
      };
    }

    case "get_winners": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const winners = gameManager.getWinners();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(winners)
        }]
      };
    }

    case "is_competitive": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      // Stub implementation since method doesn't exist
      const isCompetitive = true;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ isCompetitive })
        }]
      };
    }

    case "get_teams_enabled": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Player address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const teamsEnabled = gameManager.getTeamsEnabled();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ teamsEnabled })
        }]
      };
    }

    case "get_game_duration":
    case "get_start_time":
    case "time_until_next_broadcast":
    case "claim_victory": {
      // Implementation needed
      throw new Error("Not implemented");
    }

    default:
      throw new Error(`Unknown game state tool: ${request.params.name}`);
  }
} 