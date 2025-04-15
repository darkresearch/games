import { z } from "zod";
import { zodToMcpSchema } from "../tools/utils";

/**
 * Zod schemas for player-related resources
 */
export const PlayersSchema = z.object({});

export const PlayerLocationSchema = z.object({
  address: z.string().describe("Player's Ethereum address")
});

/**
 * Player-related resource schemas for Dark Forest MCP
 */
export const playerResources = [
  {
    uri: "players",
    description: "List of all players in the game",
    schema: zodToMcpSchema(PlayersSchema, "Players")
  },
  {
    uri: "player_location",
    description: "Get the current location of a player",
    schema: zodToMcpSchema(PlayerLocationSchema, "PlayerLocation")
  }
]; 