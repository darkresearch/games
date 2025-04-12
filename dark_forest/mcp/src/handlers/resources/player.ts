import { ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { PlayerRegistry } from "../../core/PlayerRegistry";
import * as logger from '../../helpers/logger';

export function setupPlayerResourceHandlers(playerRegistry: PlayerRegistry, request: ReadResourceRequest) {
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