import { ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
import { EthAddress } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';

export function setupPlayerResourceHandlers(playerRegistry: PlayerRegistry, request: ReadResourceRequest) {
  const uri = request.params.uri;
  
  // Handle players list resource
  if (uri === "/players") {
    logger.debug("Returning players list");
    
    const playerAddresses = playerRegistry.getAllPlayerAddresses();
    
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(playerAddresses)
      }]
    };
  }
  
  // Handle player location resource
  if (uri === "/player/location") {
    const query = request.params.query as Record<string, string> || {};
    const playerAddress = query.player as EthAddress;
    
    if (!playerAddress) {
      throw new Error("Missing required 'player' parameter with player address");
    }
    
    logger.debug(`Getting location for player: ${playerAddress}`);
    
    const location = playerRegistry.getPlayerLocation(playerAddress);
    
    if (!location) {
      throw new Error(`Player not found: ${playerAddress}`);
    }
    
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(location)
      }]
    };
  }
  
  throw new Error(`Unknown player resource: ${uri}`);
} 