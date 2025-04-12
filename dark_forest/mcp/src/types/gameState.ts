import { z } from "zod";
import { zodToMcpSchema } from "./utils";

/**
 * Base schemas for common properties
 */
const AddressSchema = z.object({
  address: z.string().describe("Player's Ethereum address")
});

/**
 * Zod schemas for game state-related tools
 */
export const GetWorldRadiusSchema = AddressSchema;

export const GetHashConfigSchema = AddressSchema;

export const GetEndTimeSecondsSchema = AddressSchema;

export const GetTokenMintEndTimeSecondsSchema = AddressSchema;

export const IsGameOverSchema = AddressSchema;

export const GetWinnersSchema = AddressSchema;

export const IsCompetitiveSchema = AddressSchema;

export const GetTeamsEnabledSchema = AddressSchema;

export const GetAllVoyagesSchema = AddressSchema;

export const GetUnconfirmedMovesSchema = AddressSchema;

export const GetUnconfirmedUpgradesSchema = AddressSchema;

/**
 * Game state-related tool schemas for Dark Forest MCP
 */
export const gameStateSchemas = [
  {
    name: "get_world_radius",
    description: "Get the radius of the game world",
    inputSchema: zodToMcpSchema(GetWorldRadiusSchema, "Get world radius")
  },
  {
    name: "get_hash_config",
    description: "Get the hash configuration",
    inputSchema: zodToMcpSchema(GetHashConfigSchema, "Get hash config")
  },
  {
    name: "get_end_time_seconds",
    description: "Get game end time in seconds",
    inputSchema: zodToMcpSchema(GetEndTimeSecondsSchema, "Get end time")
  },
  {
    name: "get_token_mint_end_time_seconds",
    description: "Get token mint end time in seconds",
    inputSchema: zodToMcpSchema(GetTokenMintEndTimeSecondsSchema, "Get token mint end time")
  },
  {
    name: "is_game_over",
    description: "Check if the game is over",
    inputSchema: zodToMcpSchema(IsGameOverSchema, "Check game over")
  },
  {
    name: "get_winners",
    description: "Get the winners of the game",
    inputSchema: zodToMcpSchema(GetWinnersSchema, "Get winners")
  },
  {
    name: "is_competitive",
    description: "Check if the game is competitive",
    inputSchema: zodToMcpSchema(IsCompetitiveSchema, "Check competitive")
  },
  {
    name: "get_teams_enabled",
    description: "Check if teams are enabled",
    inputSchema: zodToMcpSchema(GetTeamsEnabledSchema, "Check teams enabled")
  },
  {
    name: "get_all_voyages",
    description: "Get all active voyages",
    inputSchema: zodToMcpSchema(GetAllVoyagesSchema, "Get all voyages")
  },
  {
    name: "get_unconfirmed_moves",
    description: "Get all unconfirmed moves",
    inputSchema: zodToMcpSchema(GetUnconfirmedMovesSchema, "Get unconfirmed moves")
  },
  {
    name: "get_unconfirmed_upgrades",
    description: "Get all unconfirmed upgrades",
    inputSchema: zodToMcpSchema(GetUnconfirmedUpgradesSchema, "Get unconfirmed upgrades")
  }
]; 