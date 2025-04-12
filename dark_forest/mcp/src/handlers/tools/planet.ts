import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../registry/PlayerRegistry";
import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { EthAddress, LocationId } from "@darkforest_eth/types";
import * as logger from '../../helpers/logger';
import { z } from "zod";

// Request schemas
const AddressAndPlanetIdsSchema = z.object({
  method: z.literal("bulk_get_planets"),
  params: z.object({
    arguments: z.object({
      address: z.string(),
      planetIds: z.array(z.string())
    })
  })
});

/**
 * Handles all planet-related tool requests
 */
export async function setupPlanetHandlers(server: Server, playerRegistry: PlayerRegistry, request: CallToolRequest) {
  const args = request.params.arguments || {};
  
  switch (request.params.name) {
    case "get_planet": {
      const planetId = args.planetId as string;
      if (!planetId) {
        throw new Error("Planet ID is required");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(args.address as EthAddress);
      const planet = await gameManager.getPlanet(planetId as LocationId);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(planet)
        }]
      };
    }

    case "move": {
      const address = args.address as string;
      const fromId = args.fromId as string;
      const toId = args.toId as string;
      const forces = Number(args.forces);
      const silver = Number(args.silver || 0);

      if (!address || !fromId || !toId || isNaN(forces)) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.move(fromId as LocationId, toId as LocationId, forces, silver);

      return {
        content: [{
          type: "text",
          text: `Move initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "upgrade_planet": {
      const address = args.address as string;
      const planetId = args.planetId as string;
      const branch = Number(args.branch);

      if (!address || !planetId || isNaN(branch)) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.upgradePlanet(planetId as LocationId, branch);

      return {
        content: [{
          type: "text",
          text: `Planet upgrade initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "buy_hat": {
      const address = args.address as string;
      const planetId = args.planetId as string;

      if (!address || !planetId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const tx = await gameManager.buyHat(planetId as LocationId);

      return {
        content: [{
          type: "text",
          text: `Hat purchase initiated: ${JSON.stringify(tx)}`
        }]
      };
    }

    case "get_planets_in_range": {
      const address = args.address as string;
      const planetId = args.planetId as string;
      const sendingPercent = Number(args.sendingPercent);
      const abandoning = Boolean(args.abandoning || false);

      if (!address || !planetId || isNaN(sendingPercent)) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const planets = gameManager.getPlanetsInRange(planetId as LocationId, sendingPercent, abandoning);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(planets)
        }]
      };
    }

    case "get_max_move_dist": {
      const address = args.address as string;
      const planetId = args.planetId as string;
      const sendingPercent = Number(args.sendingPercent);
      const abandoning = Boolean(args.abandoning || false);

      if (!address || !planetId || isNaN(sendingPercent)) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const maxDist = gameManager.getMaxMoveDist(planetId as LocationId, sendingPercent, abandoning);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ maxDist })
        }]
      };
    }

    case "get_energy_needed_for_move": {
      const address = args.address as string;
      const fromId = args.fromId as string;
      const toId = args.toId as string;
      const arrivingEnergy = Number(args.arrivingEnergy);
      const abandoning = Boolean(args.abandoning || false);

      if (!address || !fromId || !toId || isNaN(arrivingEnergy)) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const energyNeeded = gameManager.getEnergyNeededForMove(
        fromId as LocationId,
        toId as LocationId,
        arrivingEnergy,
        abandoning
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ energyNeeded })
        }]
      };
    }

    case "get_time_for_move": {
      const address = args.address as string;
      const fromId = args.fromId as string;
      const toId = args.toId as string;
      const abandoning = Boolean(args.abandoning || false);

      if (!address || !fromId || !toId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const timeForMove = gameManager.getTimeForMove(fromId as LocationId, toId as LocationId, abandoning);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ timeForMove })
        }]
      };
    }

    case "get_dist": {
      const address = args.address as string;
      const fromId = args.fromId as string;
      const toId = args.toId as string;

      if (!address || !fromId || !toId) {
        throw new Error("Missing required parameters");
      }

      const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
      const distance = gameManager.getDist(fromId as LocationId, toId as LocationId);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ distance })
        }]
      };
    }

    case "get_planet_range":
    case "is_planet_locatable":
    case "is_space_ship":
    case "get_planet_name":
    case "is_planet_mineable":
    case "get_temperature":
    case "transfer_ownership":
    case "bulk_get_planets": {
      // Implementation needed
      throw new Error("Not implemented");
    }

    default:
      throw new Error(`Unknown planet tool: ${request.params.name}`);
  }
} 