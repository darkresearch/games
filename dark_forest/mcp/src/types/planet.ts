import { z } from "zod";
import { zodToMcpSchema } from "./utils";

/**
 * Base schemas for common properties
 */
const AddressSchema = z.object({
  address: z.string().describe("Player's Ethereum address")
});

const PlanetIdSchema = z.object({
  planetId: z.string().describe("Planet ID")
});

/**
 * Zod schemas for planet-related tools
 */
export const GetPlanetSchema = PlanetIdSchema;

export const MovePlanetSchema = AddressSchema.extend({
  fromId: z.string().describe("Source planet ID"),
  toId: z.string().describe("Destination planet ID"),
  forces: z.number().describe("Amount of forces to send"),
  silver: z.number().optional().describe("Amount of silver to send")
});

export const UpgradePlanetSchema = AddressSchema.extend({
  planetId: z.string().describe("Planet ID to upgrade"),
  branch: z.number().describe("Upgrade branch (0: Defense, 1: Range, 2: Speed)")
});

export const BuyHatSchema = AddressSchema.extend({
  planetId: z.string().describe("Planet ID to buy hat for")
});

export const WithdrawSilverSchema = AddressSchema.extend({
  locationId: z.string().describe("Planet ID to withdraw silver from"),
  amount: z.number().describe("Amount of silver to withdraw")
});

export const GetDistSchema = AddressSchema.extend({
  fromId: z.string().describe("Source planet ID"),
  toId: z.string().describe("Destination planet ID")
});

export const GetMaxMoveDistSchema = AddressSchema.extend({
  planetId: z.string().describe("Planet ID to check"),
  sendingPercent: z.number().describe("Percentage of forces to send"),
  abandoning: z.boolean().optional().describe("Whether the planet is being abandoned")
});

export const GetEnergyNeededSchema = AddressSchema.extend({
  fromId: z.string().describe("Source planet ID"),
  toId: z.string().describe("Destination planet ID"),
  arrivingEnergy: z.number().describe("Energy to arrive with"),
  abandoning: z.boolean().optional().describe("Whether the planet is being abandoned")
});

export const GetTimeForMoveSchema = AddressSchema.extend({
  fromId: z.string().describe("Source planet ID"),
  toId: z.string().describe("Destination planet ID"),
  abandoning: z.boolean().optional().describe("Whether the planet is being abandoned")
});

export const GetPlanetsInRangeSchema = AddressSchema.extend({
  planetId: z.string().describe("Planet ID to check"),
  sendingPercent: z.number().describe("Percentage of forces to send"),
  abandoning: z.boolean().optional().describe("Whether the planet is being abandoned")
});

export const GetMyPlanetsSchema = AddressSchema;

/**
 * Planet-related tool schemas for Dark Forest MCP
 */
export const planetSchemas = [
  {
    name: "get_planet",
    description: "Get information about a planet",
    inputSchema: zodToMcpSchema(GetPlanetSchema, "Get planet info")
  },
  {
    name: "move",
    description: "Move from one planet to another",
    inputSchema: zodToMcpSchema(MovePlanetSchema, "Move between planets")
  },
  {
    name: "upgrade_planet",
    description: "Upgrade a planet",
    inputSchema: zodToMcpSchema(UpgradePlanetSchema, "Upgrade planet")
  },
  {
    name: "buy_hat",
    description: "Buy a hat for a planet",
    inputSchema: zodToMcpSchema(BuyHatSchema, "Buy planet hat")
  },
  {
    name: "withdraw_silver",
    description: "Withdraw silver from a planet",
    inputSchema: zodToMcpSchema(WithdrawSilverSchema, "Withdraw silver")
  },
  {
    name: "get_dist",
    description: "Get distance between two planets",
    inputSchema: zodToMcpSchema(GetDistSchema, "Get distance")
  },
  {
    name: "get_max_move_dist",
    description: "Get maximum move distance for a planet",
    inputSchema: zodToMcpSchema(GetMaxMoveDistSchema, "Get max move distance")
  },
  {
    name: "get_energy_needed_for_move",
    description: "Calculate energy needed for a move",
    inputSchema: zodToMcpSchema(GetEnergyNeededSchema, "Calculate energy needed")
  },
  {
    name: "get_time_for_move",
    description: "Calculate time for a move",
    inputSchema: zodToMcpSchema(GetTimeForMoveSchema, "Calculate move time")
  },
  {
    name: "get_planets_in_range",
    description: "Get planets within range of a planet",
    inputSchema: zodToMcpSchema(GetPlanetsInRangeSchema, "Get planets in range")
  },
  {
    name: "get_my_planets",
    description: "Get all planets owned by the player",
    inputSchema: zodToMcpSchema(GetMyPlanetsSchema, "Get my planets")
  }
]; 