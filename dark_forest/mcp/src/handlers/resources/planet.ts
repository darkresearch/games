import { ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
import { EthAddress, LocationId } from "@darkforest_eth/types";
import { locationIdFromDecStr, locationIdToDecStr, decodePlanet } from "@darkforest_eth/serde";
import * as logger from '../../helpers/logger';

export async function setupPlanetResourceHandlers(playerRegistry: PlayerRegistry, request: ReadResourceRequest) {
  logger.debug(`Processing planet resource request: ${request.params.uri}`);
  
  // Extract planetId from URI path parameters
  // Expected format: /planet/{planetId}
  const uri = request.params.uri;
  const match = uri.match(/^\/planet\/([^/]+)$/);
  
  if (!match) {
    throw new Error(`Invalid planet URI format: ${uri}`);
  }
  
  const planetId = match[1] as LocationId;
  logger.debug(`Looking up planet with ID: ${planetId}`);

  // Look for player parameter in query
  // TypeScript doesn't know the query structure, so we need to use a type assertion
  const query = request.params.query as Record<string, string> || {};
  const playerAddress = query.player as EthAddress | undefined;
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
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(planet)
      }]
    };
  } catch (error) {
    logger.error(`Error getting planet data: ${logger.formatError(error)}`);
    throw new Error(`Failed to get planet: ${error}`);
  }
} 