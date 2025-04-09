import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { EthAddress, LocationId, ArtifactId } from "@darkforest_eth/types";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import { toolSchemas } from "../types/toolSchemas";
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

const AddressPlanetAndPercentSchema = z.object({
  method: z.literal("get_energy_curve"),
  params: z.object({
    arguments: z.object({
      address: z.string(),
      planetId: z.string(),
      percent: z.number()
    })
  })
});

const AddressAndPlanetSchema = z.object({
  method: z.literal("prospect_planet"),
  params: z.object({
    arguments: z.object({
      address: z.string(),
      planetId: z.string()
    })
  })
});

export function setupToolHandlers(server: Server, playerRegistry: PlayerRegistry) {
  /**
   * List available game tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: toolSchemas };
  });

  /**
   * Handle tool calls
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case "init_player": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        
        // Generate random coordinates for initialization
        const x = Math.floor(Math.random() * 10000);
        const y = Math.floor(Math.random() * 10000);
        const r = Math.floor(Math.random() * 10000);
        const f = Math.floor(Math.random() * 10000);
        
        await gameManager.initializePlayer(x, y, r, f);

        return {
          content: [{
            type: "text",
            text: "Player initialized"
          }]
        };
      }

      case "move": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const fromId = args.fromId as string;
        const toId = args.toId as string;
        const forces = args.forces as number;
        const silver = (args.silver as number) || 0;

        if (!address || !fromId || !toId || typeof forces !== 'number') {
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

      case "get_planet": {
        const args = request.params.arguments || {};
        const planetId = args.planetId as string;

        if (!planetId) {
          throw new Error("Planet ID is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(EMPTY_ADDRESS);
        const planet = await gameManager.getPlanet(planetId as LocationId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(planet)
          }]
        };
      }

      case "get_player": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const player = await gameManager.getPlayer(address as EthAddress);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(player)
          }]
        };
      }

      case "reveal_location": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;

        if (!address || !planetId) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        
        // Generate coordinates for reveal
        const x = Math.floor(Math.random() * 10000);
        const y = Math.floor(Math.random() * 10000);
        const r = Math.floor(Math.random() * 10000);
        
        const tx = await gameManager.revealLocation(planetId as LocationId, x, y, r);

        return {
          content: [{
            type: "text",
            text: `Location reveal initiated: ${JSON.stringify(tx)}`
          }]
        };
      }

      case "upgrade_planet": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;
        const branch = args.branch as number;

        if (!address || !planetId || typeof branch !== 'number') {
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
        const args = request.params.arguments || {};
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

      case "deposit_artifact": {
        const args = request.params.arguments || {};
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
        const args = request.params.arguments || {};
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
        const args = request.params.arguments || {};
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

      case "withdraw_silver": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const locationId = args.locationId as string;
        const amount = args.amount as number;

        if (!address || !locationId || typeof amount !== 'number') {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const tx = await gameManager.withdrawSilver(locationId as LocationId, amount);

        return {
          content: [{
            type: "text",
            text: `Silver withdrawal initiated: ${JSON.stringify(tx)}`
          }]
        };
      }

      default:
        throw new Error("Unknown tool");
    }
  });

  server.setRequestHandler(AddressAndPlanetIdsSchema, async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetIds = args.planetIds;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const planets = await gameManager.bulkGetPlanets(planetIds as LocationId[]);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(Array.from(planets.entries()))
      }]
    };
  });

  server.setRequestHandler(AddressAndPlanetIdsSchema.extend({ method: z.literal("bulk_refresh_planets") }), async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetIds = args.planetIds;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    await gameManager.bulkHardRefreshPlanets(planetIds as LocationId[]);

    return {
      content: [{
        type: "text",
        text: "Planets refreshed successfully"
      }]
    };
  });

  server.setRequestHandler(AddressPlanetAndPercentSchema, async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;
    const percent = args.percent;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const planet = await gameManager.getPlanet(planetId as LocationId);
    
    if (!planet) {
      throw new Error("Planet not found");
    }

    const timestamp = gameManager.getEnergyCurveAtPercent(planet, percent);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ timestamp })
      }]
    };
  });

  server.setRequestHandler(AddressPlanetAndPercentSchema.extend({ method: z.literal("get_silver_curve") }), async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;
    const percent = args.percent;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const planet = await gameManager.getPlanet(planetId as LocationId);
    
    if (!planet) {
      throw new Error("Planet not found");
    }

    const timestamp = gameManager.getSilverCurveAtPercent(planet, percent);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ timestamp })
      }]
    };
  });

  server.setRequestHandler(AddressAndPlanetSchema, async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const transaction = await gameManager.prospectPlanet(planetId as LocationId);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(transaction)
      }]
    };
  });

  server.setRequestHandler(AddressAndPlanetSchema.extend({ method: z.literal("find_artifact") }), async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const transaction = await gameManager.findArtifact(planetId as LocationId);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(transaction)
      }]
    };
  });

  server.setRequestHandler(AddressAndPlanetSchema.extend({ method: z.literal("get_planet_range") }), async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const range = gameManager.getRange(planetId as LocationId);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ range })
      }]
    };
  });

  server.setRequestHandler(AddressAndPlanetSchema.extend({ method: z.literal("is_planet_locatable") }), async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const locatable = gameManager.isLocatable(planetId as LocationId);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ locatable })
      }]
    };
  });

  server.setRequestHandler(AddressAndPlanetSchema.extend({ method: z.literal("is_space_ship") }), async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const isSpaceShip = gameManager.isSpaceShip(planetId as LocationId);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ isSpaceShip })
      }]
    };
  });

  server.setRequestHandler(AddressAndPlanetSchema.extend({ method: z.literal("get_planet_name") }), async (request) => {
    const args = request.params.arguments;
    const address = args.address;
    const planetId = args.planetId;

    const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
    const name = gameManager.getPlanetName(planetId as LocationId);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ name })
      }]
    };
  });
} 