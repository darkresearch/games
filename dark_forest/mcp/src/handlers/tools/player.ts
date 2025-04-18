import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
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
    
    case "update_location": {
      const address = args.address as EthAddress;
      const x = args.x as number;
      const y = args.y as number;
      
      // Validate parameters
      if (!address) {
        throw new Error("Player address is required");
      }
      
      if (x === undefined || y === undefined) {
        throw new Error("Both x and y coordinates are required");
      }
      
      // Check if player exists
      if (!playerRegistry.getPlayer(address)) {
        throw new Error(`Player not found: ${address}`);
      }
      
      // Update player location
      playerRegistry.updatePlayerLocation(address, x, y);
      
      logger.debug(`Updated location for player ${address} to (${x}, ${y})`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            success: true,
            address,
            location: { x, y },
            message: `Player location updated to (${x}, ${y})`
          })
        }]
      };
    }

    case "players": {
      logger.debug("Listing all players");
      
      const playerAddresses = playerRegistry.getAllPlayerAddresses();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            players: playerAddresses,
            count: playerAddresses.length
          })
        }]
      };
    }

    case "player_location": {
      const playerAddress = args.address as EthAddress;
      
      if (!playerAddress) {
        throw new Error("Missing required 'player' parameter with player address");
      }
      
      logger.debug(`Getting location for player: ${playerAddress}`);
      
      const location = playerRegistry.getPlayerLocation(playerAddress);
      
      if (!location) {
        throw new Error(`Player not found: ${playerAddress}`);
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(location)
        }]
      };
    }

    default:
      throw new Error(`Unknown player tool: ${request.params.name}`);
  }
} 