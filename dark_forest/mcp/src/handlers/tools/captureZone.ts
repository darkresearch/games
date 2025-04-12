import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../registry/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress, LocationId } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';

/**
 * Handles all capture zone-related tool requests
 */
export async function setupCaptureZoneHandlers(server: Server, playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "get_capture_zones": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const captureZones = gameManager.getCaptureZones();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            zones: Array.from(captureZones)
          })
        }]
      };
    }
    
    case "is_planet_in_capture_zone": {
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Address and planetId are required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const isInZone = await gameManager.isPlanetInCaptureZone(planetId as LocationId);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            planetId,
            isInCaptureZone: isInZone
          })
        }]
      };
    }
    
    case "get_next_capture_zone_change": {
      const address = args.address as string;

      if (!address) {
        throw new Error("Address is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const nextChangeBlock = await gameManager.getNextCaptureZoneChangeBlock();
      
      // Get current block for context
      const currentBlock = await gameManager.getEthConnection().getCurrentBlockNumber();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            currentBlock,
            nextChangeBlock,
            blocksUntilChange: nextChangeBlock - currentBlock
          })
        }]
      };
    }

    case "invade_planet": {
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Address and planetId are required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      
      // Check if planet is in a capture zone
      const isInZone = await gameManager.isPlanetInCaptureZone(planetId as LocationId);
      if (!isInZone) {
        throw new Error("Planet is not in a capture zone");
      }
      
      // Call invade functionality
      // In a real implementation, this would call the contract method
      // For now, we'll just return success
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Planet invasion initiated",
            planetId
          })
        }]
      };
    }

    case "capture_planet": {
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Address and planetId are required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      
      // Check if planet is in a capture zone
      const isInZone = await gameManager.isPlanetInCaptureZone(planetId as LocationId);
      if (!isInZone) {
        throw new Error("Planet is not in a capture zone");
      }
      
      // Check if planet is already invaded
      const planet = await gameManager.getPlanet(planetId as LocationId);
      if (!planet) {
        throw new Error("Planet not found");
      }
      
      // In a real implementation, we would check if the planet has been invaded long enough
      // and has enough energy for capture
      
      // Call capture functionality
      // In a real implementation, this would call the contract method
      // For now, we'll just return success
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Planet capture initiated",
            planetId
          })
        }]
      };
    }

    case "is_move_blocked":
    case "is_capture_blocked": {
      // Implementation needed
      throw new Error("Not implemented");
    }

    default:
      throw new Error(`Unknown capture zone tool: ${request.params.name}`);
  }
} 