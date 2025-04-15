import { z } from "zod";
import { zodToMcpSchema } from "../tools/utils";

/**
 * Zod schema for ping resource
 */
export const PingSchema = z.object({});

/**
 * Ping-related resource schemas for Dark Forest MCP
 */
export const pingResources = [
  {
    uri: "ping",
    mimeType: "text/plain",
    name: "Ping",
    description: "Simple ping/pong test resource",
    schema: zodToMcpSchema(PingSchema, "Ping")
  }
]; 