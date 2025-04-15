import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import * as logger from '../../helpers/logger';

/**
 * Handles ping tool requests
 */
export async function setupPingHandlers(request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "ping": {
      logger.debug("Ping tool called");
      
      return {
        content: [{
          type: "text",
          text: "pong"
        }]
      };
    }

    default:
      throw new Error(`Unknown ping tool: ${request.params.name}`);
  }
}
