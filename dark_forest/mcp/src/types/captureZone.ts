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
 * Zod schemas for capture zone-related tools
 */
export const GetCaptureZonesSchema = AddressSchema;

export const IsPlanetInCaptureZoneSchema = AddressSchema.extend({
  ...PlanetIdSchema.shape
});

export const GetNextCaptureZoneChangeSchema = AddressSchema;

export const InvadePlanetSchema = AddressSchema.extend({
  ...PlanetIdSchema.shape
});

export const CapturePlanetSchema = AddressSchema.extend({
  ...PlanetIdSchema.shape
});

export const GetCapturedPlanetsSchema = AddressSchema;

/**
 * Capture zone-related tool schemas for Dark Forest MCP
 */
export const captureZoneSchemas = [
  {
    name: "get_capture_zones",
    description: "Get all current capture zones in the universe",
    inputSchema: zodToMcpSchema(GetCaptureZonesSchema, "Get capture zones")
  },
  {
    name: "is_planet_in_capture_zone",
    description: "Check if a planet is within any capture zone",
    inputSchema: zodToMcpSchema(IsPlanetInCaptureZoneSchema, "Check planet in capture zone")
  },
  {
    name: "get_next_capture_zone_change",
    description: "Get information about when capture zones will next change",
    inputSchema: zodToMcpSchema(GetNextCaptureZoneChangeSchema, "Get next capture zone change")
  },
  {
    name: "invade_planet",
    description: "Start invasion of a planet in a capture zone",
    inputSchema: zodToMcpSchema(InvadePlanetSchema, "Invade planet")
  },
  {
    name: "capture_planet",
    description: "Capture a planet after successful invasion in a capture zone",
    inputSchema: zodToMcpSchema(CapturePlanetSchema, "Capture planet")
  },
  {
    name: "get_captured_planets",
    description: "Get all captured planets",
    inputSchema: zodToMcpSchema(GetCapturedPlanetsSchema, "Get captured planets")
  }
]; 