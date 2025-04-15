import { z } from "zod";
import { zodToMcpSchema } from "../tools/utils";

/**
 * Zod schemas for planet-related resources
 */
export const PlanetSchema = z.object({
  planetId: z.string().describe("The locationId of the planet in hex format"),
  player: z.string().optional().describe("Ethereum address of the player to use for querying the planet")
});

export const PlanetMoveTimeSchema = z.object({
  fromX: z.number().describe("X coordinate of the source planet"),
  fromY: z.number().describe("Y coordinate of the source planet"),
  toX: z.number().describe("X coordinate of the destination planet"),
  toY: z.number().describe("Y coordinate of the destination planet"),
  fromId: z.string().describe("LocationId of the source planet"),
  toId: z.string().describe("LocationId of the destination planet"),
  player: z.string().optional().describe("Ethereum address of the player to use for querying the planets")
});

export const PlanetMaxMoveDistanceSchema = z.object({
  planetId: z.string().describe("The locationId of the planet in hex format"),
  sendingPercent: z.number().describe("Percentage of the planet's current silver to use for the move"),
  player: z.string().optional().describe("Ethereum address of the player to use for querying the planet")
});

/**
 * Planet-related resource schemas for Dark Forest MCP
 */
export const planetResources = [
  {
    uri: "planet",
    description: "Information about a specific planet in the game",
    schema: zodToMcpSchema(PlanetSchema, "Planet")
  },
  {
    uri: "planet_movetime",
    description: "Calculate the time it will take to move from one planet to another",
    schema: zodToMcpSchema(PlanetMoveTimeSchema, "PlanetMoveTime")
  },
  {
    uri: "planet_maxmovedist",
    description: "Calculate the maximum distance a player can move from a planet using a percentage of silver",
    schema: zodToMcpSchema(PlanetMaxMoveDistanceSchema, "PlanetMaxMoveDistance")
  }
]; 