import { z } from "zod";
import { zodToMcpSchema, AddressSchema } from "./utils";

/**
 * Zod schemas for player-related tools
 */
export const GeneratePubkeySchema = z.object({});

export const InitPlayerSchema = AddressSchema.extend({
  x: z.number().describe("X coordinate of the planet"),
  y: z.number().describe("Y coordinate of the planet"),
  hash: z.string().describe("Planet's LocationId hash"),
  perlin: z.number().describe("Perlin value at these coordinates"),
  biomebase: z.number().describe("Biomebase perlin value at these coordinates")
});

export const UpdateLocationSchema = AddressSchema.extend({
  x: z.number().describe("New X coordinate for the player"),
  y: z.number().describe("New Y coordinate for the player")
});

/**
 * Player-related tool schemas for Dark Forest MCP
 */
export const playerSchemas = [
  {
    name: "generate_pubkey",
    description: "Generate a new Ethereum address for the agent to use with Dark Forest MCP",
    inputSchema: zodToMcpSchema(GeneratePubkeySchema, "Generate pubkey")
  },
  {
    name: "init_player",
    description: "Initialize a new player",
    inputSchema: zodToMcpSchema(InitPlayerSchema, "Initialize player")
  },
  {
    name: "update_location",
    description: "Update a player's location",
    inputSchema: zodToMcpSchema(UpdateLocationSchema, "Update player location")
  }
]; 