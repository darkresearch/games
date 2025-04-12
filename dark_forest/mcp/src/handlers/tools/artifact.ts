import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../registry/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress, LocationId, ArtifactId } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';

/**
 * Handles all artifact-related tool requests
 */
export async function setupArtifactHandlers(server: Server, playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "get_artifact": {
      const address = args.address as string;
      const artifactId = args.artifactId as string;

      if (!address || !artifactId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const artifact = await gameManager.getArtifactById(artifactId as ArtifactId);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(artifact)
        }]
      };
    }

    case "deposit_artifact": {
      const address = args.address as string;
      const locationId = args.locationId as string;
      const artifactId = args.artifactId as string;

      if (!address || !locationId || !artifactId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.depositArtifact(locationId as LocationId, artifactId as ArtifactId);

      return {
        content: [{
          type: "text",
          text: `Artifact deposit initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "withdraw_artifact": {
      const address = args.address as string;
      const locationId = args.locationId as string;
      const artifactId = args.artifactId as string;

      if (!address || !locationId || !artifactId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.withdrawArtifact(locationId as LocationId, artifactId as ArtifactId);

      return {
        content: [{
          type: "text",
          text: `Artifact withdrawal initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "activate_artifact": {
      const address = args.address as string;
      const locationId = args.locationId as string;
      const artifactId = args.artifactId as string;
      const wormholeTo = args.wormholeTo as string;

      if (!address || !locationId || !artifactId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.activateArtifact(
        locationId as LocationId,
        artifactId as ArtifactId,
        wormholeTo as LocationId
      );

      return {
        content: [{
          type: "text",
          text: `Artifact activation initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "deactivate_artifact": {
      const address = args.address as string;
      const locationId = args.locationId as string;

      if (!address || !locationId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.deactivateArtifact(locationId as LocationId);

      return {
        content: [{
          type: "text",
          text: `Artifact deactivation initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "get_active_artifact": {
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      // Stub implementation - would need to retrieve active artifact
      const activeArtifact = null;

      return {
        content: [{
          type: "text",
          text: JSON.stringify(activeArtifact)
        }]
      };
    }

    case "prospect_planet": {
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.prospectPlanet(planetId as LocationId);

      return {
        content: [{
          type: "text",
          text: `Planet prospecting initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "find_artifact": {
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.findArtifact(planetId as LocationId);

      return {
        content: [{
          type: "text",
          text: `Artifact finding initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    default:
      throw new Error(`Unknown artifact tool: ${request.params.name}`);
  }
} 