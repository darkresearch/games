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

const LocationIdSchema = z.object({
  locationId: z.string().describe("Planet ID")
});

/**
 * Zod schemas for social-related tools
 */
export const GetTwitterSchema = AddressSchema.extend({
  ...PlayerAddressSchema.shape
});

export const SubmitVerifyTwitterSchema = AddressSchema.extend({
  twitter: z.string().describe("Twitter handle to verify")
});

export const SetPlanetEmojiSchema = AddressSchema.extend({
  ...LocationIdSchema.shape,
  emojiStr: z.string().describe("Emoji to set")
});

export const ClearEmojiSchema = AddressSchema.extend({
  ...LocationIdSchema.shape
});

/**
 * Social and metadata-related tool schemas for Dark Forest MCP
 */
export const socialSchemas = [
  {
    name: "get_twitter",
    description: "Get a player's Twitter handle",
    inputSchema: zodToMcpSchema(GetTwitterSchema, "Get Twitter handle")
  },
  {
    name: "submit_verify_twitter",
    description: "Verify a player's Twitter account",
    inputSchema: zodToMcpSchema(SubmitVerifyTwitterSchema, "Verify Twitter")
  },
  {
    name: "set_planet_emoji",
    description: "Set an emoji for a planet",
    inputSchema: zodToMcpSchema(SetPlanetEmojiSchema, "Set planet emoji")
  },
  {
    name: "clear_emoji",
    description: "Clear emoji from a planet",
    inputSchema: zodToMcpSchema(ClearEmojiSchema, "Clear planet emoji")
  }
]; 