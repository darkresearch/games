import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress, LocationId } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';
import { locationIdToDecStr, decodePlanet } from "@darkforest_eth/serde";

/**
 * Handles all planet-related tool requests
 */
// Update the setupPlanetHandlers function to include the new tools
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

      if (!address || !fromId || !toId || isNaN(forces) || isNaN(silver)) {
        throw new Error("Missing required parameters or invalid number format");
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
    
    case "planet": {
      return getPlanetInfo(playerRegistry, args);
    }
    
    case "planet_movetime": {
      return calculateMoveTime(playerRegistry, args);
    }
    
    case "planet_maxmovedist": {
      return calculateMaxMoveDistance(playerRegistry, args);
    }

    default:
      throw new Error(`Unknown planet tool: ${request.params.name}`);
  }
} 

/**
 * Gets detailed information about a planet
 */
async function getPlanetInfo(playerRegistry: PlayerRegistry, args: Record<string, any>) {
  // Extract parameters from arguments
  const planetId = args.planetId as LocationId;
  const playerAddress = args.address as EthAddress | undefined;
  
  if (!planetId) {
    throw new Error("planetId is a required parameter");
  }
  
  logger.debug(`Looking up planet with ID: ${planetId}`);
  
  // Get game manager for the player
  let gameManager;
  
  if (playerAddress) {
    // Use the requested player if available
    logger.debug(`Using specified player: ${playerAddress}`);
    gameManager = playerRegistry.getPlayer(playerAddress);
    
    if (!gameManager) {
      throw new Error(`Player not found or not registered: ${playerAddress}`);
    }
  } else {
    // Fall back to first available player
    const playerAddresses = playerRegistry.getAllPlayerAddresses();
    if (playerAddresses.length === 0) {
      throw new Error("No players available to query planet data");
    }
    
    const firstPlayerAddress = playerAddresses[0] as EthAddress;
    gameManager = playerRegistry.getPlayer(firstPlayerAddress);
    
    if (!gameManager) {
      throw new Error(`Could not get game manager for player ${firstPlayerAddress}`);
    }
    
    logger.debug(`Using first available player: ${firstPlayerAddress}`);
  }
  
  // Get planet information using the contract
  try {
    // Get the contract instance from the game manager
    const contract = gameManager['contract'];
    if (!contract) {
      throw new Error("Contract not initialized");
    }
    
    // Convert locationId to decimal string for contract call
    const decStrId = locationIdToDecStr(planetId);
    
    // Make contract calls to get planet data
    const rawPlanet = await gameManager['contract'].planets(decStrId);
    
    // Check if planet exists
    if (!rawPlanet || !rawPlanet[0]) {
      throw new Error(`Planet not found: ${planetId}`);
    }
    
    // Get extended info
    const rawExtendedInfo = await gameManager['contract'].planetsExtendedInfo(decStrId);
    const rawExtendedInfo2 = await gameManager['contract'].planetsExtendedInfo2(decStrId);
    const rawArenaInfo = await gameManager['contract'].planetsArenaInfo(decStrId);
    
    // Decode planet data
    const planet = decodePlanet(
      decStrId,
      rawPlanet,
      rawExtendedInfo,
      rawExtendedInfo2,
      rawArenaInfo
    );
    
    // Return the result
    return {
      content: [{
        type: "text",
        text: JSON.stringify(planet)
      }]
    };
  } catch (error) {
    logger.error(`Error retrieving planet data: ${logger.formatError(error)}`);
    throw new Error(`Failed to retrieve planet data: ${error}`);
  }
}

/**
 * Calculates the time required for a move between two planets
 */
async function calculateMoveTime(playerRegistry: PlayerRegistry, args: Record<string, any>) {
  logger.debug(`Processing move time calculation tool request`);
  
  // Extract parameters from arguments
  const fromId = args.fromId as LocationId;
  const toId = args.toId as LocationId;
  const playerAddress = args.address as EthAddress | undefined;
  
  if (!fromId || !toId) {
    throw new Error("Both fromId and toId are required parameters");
  }
  
  // Get game manager for the player
  let gameManager;
  
  if (playerAddress) {
    // Use the requested player if available
    logger.debug(`Using specified player: ${playerAddress}`);
    gameManager = playerRegistry.getPlayer(playerAddress);
    
    if (!gameManager) {
      throw new Error(`Player not found or not registered: ${playerAddress}`);
    }
  } else {
    // Fall back to first available player
    const playerAddresses = playerRegistry.getAllPlayerAddresses();
    if (playerAddresses.length === 0) {
      throw new Error("No players available to query planet data");
    }
    
    const firstPlayerAddress = playerAddresses[0] as EthAddress;
    gameManager = playerRegistry.getPlayer(firstPlayerAddress);
    
    if (!gameManager) {
      throw new Error(`Could not get game manager for player ${firstPlayerAddress}`);
    }
    
    logger.debug(`Using first available player: ${firstPlayerAddress}`);
  }
  
  try {
    // Calculate the move time
    const moveTime = await gameManager.getTimeForMove(fromId, toId);
    
    // Return the result
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          fromId,
          toId,
          moveTimeSeconds: moveTime,
          moveTimeFormatted: formatTime(moveTime)
        })
      }]
    };
  } catch (error) {
    logger.error(`Error calculating move time: ${logger.formatError(error)}`);
    throw new Error(`Failed to calculate move time: ${error}`);
  }
}

/**
 * Calculates the maximum move distance for a planet
 */
async function calculateMaxMoveDistance(playerRegistry: PlayerRegistry, args: Record<string, any>) {
  logger.debug(`Processing max move distance calculation tool request`);
  
  // Extract parameters from arguments
  const planetId = args.planetId as LocationId;
  const sendingPercentStr = args.sendingPercent;
  const playerAddress = args.address as EthAddress | undefined;
  
  if (!planetId || !sendingPercentStr) {
    throw new Error("Both planetId and sendingPercent are required parameters");
  }
  
  // Convert sending percent to number
  const sendingPercent = parseFloat(sendingPercentStr);
  if (isNaN(sendingPercent)) {
    throw new Error("sendingPercent must be a valid number");
  }
  
  // Get game manager for the player
  let gameManager;
  
  if (playerAddress) {
    // Use the requested player if available
    logger.debug(`Using specified player: ${playerAddress}`);
    gameManager = playerRegistry.getPlayer(playerAddress);
    
    if (!gameManager) {
      throw new Error(`Player not found or not registered: ${playerAddress}`);
    }
  } else {
    // Fall back to first available player
    const playerAddresses = playerRegistry.getAllPlayerAddresses();
    if (playerAddresses.length === 0) {
      throw new Error("No players available to query planet data");
    }
    
    const firstPlayerAddress = playerAddresses[0] as EthAddress;
    gameManager = playerRegistry.getPlayer(firstPlayerAddress);
    
    if (!gameManager) {
      throw new Error(`Could not get game manager for player ${firstPlayerAddress}`);
    }
    
    logger.debug(`Using first available player: ${firstPlayerAddress}`);
  }
  
  try {
    // Calculate the max move distance
    const maxDist = await gameManager.getMaxMoveDist(planetId, sendingPercent);
    
    // Return the result
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          planetId,
          sendingPercent,
          maxMoveDistance: maxDist,
          maxMoveDistanceFormatted: `${Math.round(maxDist)} units`
        })
      }]
    };
  } catch (error) {
    logger.error(`Error calculating max move distance: ${logger.formatError(error)}`);
    throw new Error(`Failed to calculate max move distance: ${error}`);
  }
}

/**
 * Format time in seconds to a human-readable string
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
}
