import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../registry/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress, LocationId, WorldLocation } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';

/**
 * Handles all player-related tool requests
 */
export async function setupPlayerHandlers(server: Server, playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "generate_pubkey": {
      // Generate a new Ethereum address for the agent
      const address = playerRegistry.generatePubkey();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            address,
            message: "New Ethereum address generated. Use this address for future requests."
          })
        }]
      };
    }

    case "init_player": {
      const address = args.address as string;

      const x = args.x as number;
      const y = args.y as number;
      const hash = args.hash as LocationId;
      const perlin = args.perlin as number;
      const biomebase = args.biomebase as number;

      // Validate all required parameters
      if (!hash) {
        throw new Error("Planet hash (LocationId) is required");
      }

      if (perlin === undefined || perlin === null) {
        throw new Error("Perlin value is required");
      }

      if (biomebase === undefined || biomebase === null) {
        throw new Error("Biomebase value is required");
      }

      // Store the planet ID for later use
      const planetId = hash;

      const worldLocation: WorldLocation = {
        coords: {
          x,
          y
        },
        hash,
        perlin,
        biomebase
      }
      
      // Check if we have a wallet for this address
      if (!playerRegistry.hasWallet(address as EthAddress)) {
        throw new Error(`No wallet found for address ${address}. Please use the generatePubkey tool first.`);
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);

      let tx = await gameManager.initializePlayer(worldLocation);
      
      logger.debug(`Player initialized successfully: ${JSON.stringify(tx)}`);
      
      return {
        content: [{
          type: "text",
          text: `Player initialized successfully at planet ${planetId}. Result: ${JSON.stringify(tx)}`
        }]
      };
    }

    // case "get_player": {
    //   const address = args.address as string;

    //   if (!address) {
    //     throw new Error("Player address is required");
    //   }

    //   const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    //   const player = await gameManager.getPlayer(address as EthAddress);

    //   return {
    //     content: [{
    //       type: "text",
    //       text: JSON.stringify(player)
    //     }]
    //   };
    // }

    // case "get_all_players": {
    //   const address = args.address as string;

    //   if (!address) {
    //     throw new Error("Player address is required");
    //   }

    //   const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    //   const players = gameManager.getAllPlayers();

    //   return {
    //     content: [{
    //       type: "text",
    //       text: JSON.stringify(players)
    //     }]
    //   };
    // }

    // case "get_energy_of_player": {
    //   const address = args.address as string;
    //   const playerAddress = args.playerAddress as string;

    //   if (!address || !playerAddress) {
    //     throw new Error("Missing required parameters");
    //   }

    //   const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    //   const energy = await gameManager.getEnergyOfPlayer(playerAddress as EthAddress);

    //   return {
    //     content: [{
    //       type: "text",
    //       text: JSON.stringify({ energy })
    //     }]
    //   };
    // }

    // case "get_silver_of_player": {
    //   const address = args.address as string;
    //   const playerAddress = args.playerAddress as string;

    //   if (!address || !playerAddress) {
    //     throw new Error("Missing required parameters");
    //   }

    //   const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    //   const silver = await gameManager.getSilverOfPlayer(playerAddress as EthAddress);

    //   return {
    //     content: [{
    //       type: "text",
    //       text: JSON.stringify({ silver })
    //     }]
    //   };
    // }

    // case "get_player_space_junk":
    // case "get_player_space_junk_limit":
    // case "get_player_blocked_planets":
    // case "get_player_defense_planets":
    // case "get_targets_held":
    // case "is_admin":

    case "set_ready": {
      // Implementation needed
      throw new Error("Not implemented");
    }

    default:
      throw new Error(`Unknown player tool: ${request.params.name}`);
  }
} 