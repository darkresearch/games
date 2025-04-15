import { z } from "zod";
import { zodToMcpSchema } from "../tools/utils";

/**
 * Zod schema for ping resource
 */
export const PingSchema = z.object({});

/**
 * Ping-related resource schemas for Dark Forest MCP
 */
export const pingSchemas = [
  {
    name: "ping",
    description: "Simple ping/pong test resource",
    inputSchema: zodToMcpSchema(PingSchema, "Ping")
  }
]; 