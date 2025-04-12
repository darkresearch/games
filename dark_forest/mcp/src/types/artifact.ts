import { z } from "zod";
import { zodToMcpSchema } from "./utils";

/**
 * Base schemas for common properties
 */
const AddressSchema = z.object({
  address: z.string().describe("Player's Ethereum address")
});

const LocationIdSchema = z.object({
  locationId: z.string().describe("Planet ID")
});

const ArtifactIdSchema = z.object({
  artifactId: z.string().describe("Artifact ID")
});

/**
 * Zod schemas for artifact-related tools
 */
export const DepositArtifactSchema = AddressSchema.extend({
  ...LocationIdSchema.shape,
  ...ArtifactIdSchema.shape
});

export const WithdrawArtifactSchema = AddressSchema.extend({
  ...LocationIdSchema.shape,
  ...ArtifactIdSchema.shape
});

export const ActivateArtifactSchema = AddressSchema.extend({
  ...LocationIdSchema.shape,
  ...ArtifactIdSchema.shape,
  wormholeTo: z.string().optional().describe("Optional: Planet ID to create wormhole to")
});

export const DeactivateArtifactSchema = AddressSchema.extend({
  ...LocationIdSchema.shape
});

export const ProspectPlanetSchema = AddressSchema.extend({
  planetId: z.string().describe("Planet ID to prospect")
});

export const FindArtifactSchema = AddressSchema.extend({
  planetId: z.string().describe("Planet ID to find artifact on")
});

export const GetArtifactSchema = AddressSchema.extend({
  ...ArtifactIdSchema.shape
});

export const GetMyArtifactsSchema = AddressSchema;

/**
 * Artifact-related tool schemas for Dark Forest MCP
 */
export const artifactSchemas = [
  {
    name: "deposit_artifact",
    description: "Deposit an artifact on a planet",
    inputSchema: zodToMcpSchema(DepositArtifactSchema, "Deposit artifact")
  },
  {
    name: "withdraw_artifact",
    description: "Withdraw an artifact from a planet",
    inputSchema: zodToMcpSchema(WithdrawArtifactSchema, "Withdraw artifact")
  },
  {
    name: "activate_artifact",
    description: "Activate an artifact on a planet",
    inputSchema: zodToMcpSchema(ActivateArtifactSchema, "Activate artifact")
  },
  {
    name: "deactivate_artifact",
    description: "Deactivate an artifact on a planet",
    inputSchema: zodToMcpSchema(DeactivateArtifactSchema, "Deactivate artifact")
  },
  {
    name: "prospect_planet",
    description: "Prospect a planet for artifacts",
    inputSchema: zodToMcpSchema(ProspectPlanetSchema, "Prospect planet")
  },
  {
    name: "find_artifact",
    description: "Find an artifact on a planet",
    inputSchema: zodToMcpSchema(FindArtifactSchema, "Find artifact")
  },
  {
    name: "get_artifact",
    description: "Get information about an artifact",
    inputSchema: zodToMcpSchema(GetArtifactSchema, "Get artifact info")
  },
  {
    name: "get_my_artifacts",
    description: "Get all artifacts owned by the player",
    inputSchema: zodToMcpSchema(GetMyArtifactsSchema, "Get my artifacts")
  }
]; 