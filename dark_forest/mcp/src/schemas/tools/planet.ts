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
]; 