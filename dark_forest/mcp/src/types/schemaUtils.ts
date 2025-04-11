import { z } from "zod";

/**
 * Convert a Zod schema to MCP tool schema format
 * This is used to maintain a single source of truth for our schemas while
 * providing MCP-compatible JSON Schema format for the protocol
 */
export function zodToMcpSchema(schema: z.ZodObject<any>, description: string) {
  return {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(schema.shape).map(([key, value]) => [
        key,
        {
          type: value instanceof z.ZodNumber ? "number" : "string",
          description: (value as any)._def.description || ""
        }
      ])
    ),
    required: Object.keys(schema.shape)
  };
} 