import { z } from "zod";
import { zodToMcpSchema } from "./utils";

/**
 * Zod schema for mine_chunk tool
 */
export const MineChunkSchema = z.object({
  address: z.string().describe("Player's Ethereum address"),
  x: z.number().describe("X coordinate of the center of the chunk to mine"),
  y: z.number().describe("Y coordinate of the center of the chunk to mine")
});

/**
 * Mining-related tool schemas for Dark Forest MCP
 */
export const minerSchemas = [
  {
    name: "mine_chunk",
    description: "Mine a specific chunk of space to discover planets. This is the basic operation for exploration in Dark Forest.",
    inputSchema: zodToMcpSchema(MineChunkSchema, "Mine a chunk of space")
  }
]; 