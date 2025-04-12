import { ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import * as logger from '../../helpers/logger';

export function setupPingHandlers(request: ReadResourceRequest) {
  logger.debug("Returning pong");
  return {
    contents: [{
      uri: request.params.uri,
      mimeType: "text/plain",
      text: "pong"
    }]
  };
} 