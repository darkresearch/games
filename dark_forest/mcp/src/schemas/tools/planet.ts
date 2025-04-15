import { z } from "zod";
import { zodToMcpSchema, AddressSchema } from "./utils";

/**
 * Zod schemas for planet-related tools
 */
export const MovePlanetSchema = AddressSchema.extend({
  fromId: z.string().describe("Source planet ID"),
  toId: z.string().describe("Destination planet ID"),
  fromX: z.number().describe("Source planet X coordinate"),
  fromY: z.number().describe("Source planet Y coordinate"),
  toX: z.number().describe("Destination planet X coordinate"),
  toY: z.number().describe("Destination planet Y coordinate"),
  forces: z.number().describe("Amount of forces to send"),
  silver: z.number().optional().describe("Amount of silver to send")
});

export const PlanetSchema = z.object({
  planetId: z.string().describe("The locationId of the planet in hex format"),
  address: z.string().optional().describe("Ethereum address of the player to use for querying the planet")
});

export const PlanetMoveTimeSchema = z.object({
  fromX: z.number().describe("X coordinate of the source planet"),
  fromY: z.number().describe("Y coordinate of the source planet"),
  toX: z.number().describe("X coordinate of the destination planet"),
  toY: z.number().describe("Y coordinate of the destination planet"),
  fromId: z.string().describe("LocationId of the source planet"),
  toId: z.string().describe("LocationId of the destination planet"),
  address: z.string().optional().describe("Ethereum address of the player to use for querying the planets")
});

export const PlanetMaxMoveDistanceSchema = z.object({
  planetId: z.string().describe("The locationId of the planet in hex format"),
  sendingPercent: z.number().describe("Percentage of the planet's current silver to use for the move"),
  address: z.string().optional().describe("Ethereum address of the player to use for querying the planet")
});

/**
 * Planet-related tool schemas for Dark Forest MCP
 */
export const planetSchemas = [
  // `move` is a VERY simple tool -- it assumes that all the calculations behind energy spend,
  // `silver` movement, planet understanding, etc. have been done already and it *just* facilitates
  // movement.
  {
    name: "move",
    description: "Move from one planet to another",
    inputSchema: zodToMcpSchema(MovePlanetSchema, "Move between planets")
  },
  {
    name: "planet",
    description: "Information about a specific planet in the game",
    inputSchema: zodToMcpSchema(PlanetSchema, "Planet")
  },
  {
    name: "planet_movetime",
    description: "Calculate the time it will take to move from one planet to another",
    inputSchema: zodToMcpSchema(PlanetMoveTimeSchema, "PlanetMoveTime")
  },
  {
    name: "planet_maxmovedist",
    description: "Calculate the maximum distance a player can move from a planet using a percentage of silver",
    inputSchema: zodToMcpSchema(PlanetMaxMoveDistanceSchema, "PlanetMaxMoveDistance")
  }
]; 
