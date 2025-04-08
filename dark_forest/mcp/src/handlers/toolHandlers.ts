import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { EthAddress, LocationId, ArtifactId } from "@darkforest_eth/types";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import { toolSchemas } from "../types/toolSchemas";

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
        const tx = await gameManager.upgrade(planetId as LocationId, branch);

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
} 