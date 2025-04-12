import { z } from "zod";
import { zodToMcpSchema } from "./utils";

/**
 * Base schemas for common properties
 */
const AddressSchema = z.object({
  address: z.string().describe("Player's Ethereum address")
});

const PlayerAddressSchema = z.object({
  playerAddress: z.string().describe("Target player's Ethereum address")
});

/**
 * Zod schemas for player-related tools
 */
export const GeneratePubkeySchema = z.object({});

export const InitPlayerSchema = AddressSchema;

export const GetPlayerSchema = AddressSchema;

export const GetAllPlayersSchema = AddressSchema;

export const GetPlayerScoreSchema = AddressSchema.extend({
  ...PlayerAddressSchema.shape
});

export const GetEnergyOfPlayerSchema = AddressSchema.extend({
  ...PlayerAddressSchema.shape
});

export const GetSilverOfPlayerSchema = AddressSchema.extend({
  ...PlayerAddressSchema.shape
});

export const GetHomeCoordsSchema = AddressSchema;

export const IsAdminSchema = AddressSchema.extend({
  ...PlayerAddressSchema.shape
});

/**
 * Player-related tool schemas for Dark Forest MCP
 */
export const playerSchemas = [
  {
    name: "generatePubkey",
    description: "Generate a new Ethereum address for the agent to use with Dark Forest MCP",
    inputSchema: zodToMcpSchema(GeneratePubkeySchema, "Generate pubkey")
  },
  {
    name: "init_player",
    description: "Initialize a new player",
    inputSchema: zodToMcpSchema(InitPlayerSchema, "Initialize player")
  },
  {
    name: "get_player",
    description: "Get information about a player",
    inputSchema: zodToMcpSchema(GetPlayerSchema, "Get player info")
  },
  {
    name: "get_all_players",
    description: "Get information about all players",
    inputSchema: zodToMcpSchema(GetAllPlayersSchema, "Get all players")
  },
  {
    name: "get_player_score",
    description: "Get a player's score",
    inputSchema: zodToMcpSchema(GetPlayerScoreSchema, "Get player score")
  },
  {
    name: "get_energy_of_player",
    description: "Get a player's total energy",
    inputSchema: zodToMcpSchema(GetEnergyOfPlayerSchema, "Get player energy")
  },
  {
    name: "get_silver_of_player",
    description: "Get a player's total silver",
    inputSchema: zodToMcpSchema(GetSilverOfPlayerSchema, "Get player silver")
  },
  {
    name: "get_home_coords",
    description: "Get the coordinates of the player's home planet",
    inputSchema: zodToMcpSchema(GetHomeCoordsSchema, "Get home coordinates")
  },
  {
    name: "is_admin",
    description: "Check if a player is an admin",
    inputSchema: zodToMcpSchema(IsAdminSchema, "Check admin status")
  }
]; 
