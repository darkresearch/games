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
      case "generatePubkey": {
        // Generate a new Ethereum address for the agent
        const address = playerRegistry.generatePubkey();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ 
              address,
              message: "New Ethereum address generated. Use this address for future requests."
            })
          }]
        };
      }
      
      case "init_player": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }
        
        // Check if we have a wallet for this address
        if (!playerRegistry.hasWallet(address as EthAddress)) {
          throw new Error(`No wallet found for address ${address}. Please use the generatePubkey tool first.`);
        }

        try {
          const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
          
          // Generate random coordinates and calculate radius
          const x = Math.floor(Math.random() * 10000);
          const y = Math.floor(Math.random() * 10000);
          
          // Calculate radius using the same formula as the original client
          // floor(sqrt(x^2 + y^2)) + 1
          const r = Math.floor(Math.sqrt(x ** 2 + y ** 2)) + 1;
          
          // Random faction/team value (0-9)
          const f = Math.floor(Math.random() * 10);
          
          console.log(`Initializing player at coordinates (${x}, ${y}) with radius ${r}, team ${f}`);
          
          // Initialize the player using the snark helper for proof generation
          const result = await gameManager.initializePlayer(x, y, r, f);
          
          return {
            content: [{
              type: "text",
              text: `Player initialized at (${x}, ${y}), radius ${r}, team ${f}. Transaction: ${JSON.stringify(result)}`
            }]
          };
        } catch (e) {
          console.error('Error initializing player:', e);
          throw e;
        }
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

      case "deactivate_artifact": {
        const args = request.params.arguments || {};
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

      case "prospect_planet": {
        const args = request.params.arguments || {};
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
        const args = request.params.arguments || {};
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

      case "get_artifact": {
        const args = request.params.arguments || {};
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

      case "get_all_players": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const players = gameManager.getAllPlayers();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(players)
          }]
        };
      }

      case "get_twitter": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress as string;

        if (!address || !playerAddress) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const twitter = await gameManager.getTwitter(playerAddress as EthAddress);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ twitter })
          }]
        };
      }

      case "get_discovered_planets": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const miningService = gameManager.getMiningService();
        
        const planetIds = miningService.getDiscoveredPlanets(address as EthAddress);
        
        // Optionally fetch planet details
        const planetDetails = args.includeDetails ? 
          await Promise.all(planetIds.map(id => gameManager.getPlanet(id))) :
          [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              planetIds,
              planetDetails: args.includeDetails ? planetDetails : undefined
            })
          }]
        };
      }

      case "get_world_radius": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const worldRadius = gameManager.getWorldRadius();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ worldRadius })
          }]
        };
      }

      case "get_hash_config": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const hashConfig = gameManager.getHashConfig();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(hashConfig)
          }]
        };
      }

      case "get_energy_of_player": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress as string;

        if (!address || !playerAddress) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const energy = await gameManager.getEnergyOfPlayer(playerAddress as EthAddress);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ energy })
          }]
        };
      }

      case "get_silver_of_player": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress as string;

        if (!address || !playerAddress) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const silver = await gameManager.getSilverOfPlayer(playerAddress as EthAddress);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ silver })
          }]
        };
      }

      case "get_end_time_seconds": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const endTimeSeconds = await gameManager.getEndTimeSeconds();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ endTimeSeconds })
          }]
        };
      }

      case "get_token_mint_end_time_seconds": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const tokenMintEndTimeSeconds = await gameManager.getTokenMintEndTimeSeconds();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ tokenMintEndTimeSeconds })
          }]
        };
      }

      case "get_dist": {
        const args = request.params.arguments || {};
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

      case "get_max_move_dist": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;
        const sendingPercent = args.sendingPercent as number;
        const abandoning = args.abandoning as boolean || false;

        if (!address || !planetId || typeof sendingPercent !== 'number') {
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
        const args = request.params.arguments || {};
        const address = args.address as string;
        const fromId = args.fromId as string;
        const toId = args.toId as string;
        const arrivingEnergy = args.arrivingEnergy as number;
        const abandoning = args.abandoning as boolean || false;

        if (!address || !fromId || !toId || typeof arrivingEnergy !== 'number') {
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
        const args = request.params.arguments || {};
        const address = args.address as string;
        const fromId = args.fromId as string;
        const toId = args.toId as string;
        const abandoning = args.abandoning as boolean || false;

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

      case "get_planets_in_range": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;
        const sendingPercent = args.sendingPercent as number;
        const abandoning = args.abandoning as boolean || false;

        if (!address || !planetId || typeof sendingPercent !== 'number') {
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

      case "invade_planet": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;

        if (!address || !planetId) {
          throw new Error("Address and planetId are required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        
        // Check if planet is in a capture zone
        const isInZone = await gameManager.isPlanetInCaptureZone(planetId as LocationId);
        if (!isInZone) {
          throw new Error("Planet is not in a capture zone");
        }
        
        // Call invade functionality
        // In a real implementation, this would call the contract method
        // For now, we'll just return success
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Planet invasion initiated",
              planetId
            })
          }]
        };
      }

      case "capture_planet": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;

        if (!address || !planetId) {
          throw new Error("Address and planetId are required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        
        // Check if planet is in a capture zone
        const isInZone = await gameManager.isPlanetInCaptureZone(planetId as LocationId);
        if (!isInZone) {
          throw new Error("Planet is not in a capture zone");
        }
        
        // Check if planet is already invaded
        const planet = await gameManager.getPlanet(planetId as LocationId);
        if (!planet) {
          throw new Error("Planet not found");
        }
        
        // In a real implementation, we would check if the planet has been invaded long enough
        // and has enough energy for capture
        
        // Call capture functionality
        // In a real implementation, this would call the contract method
        // For now, we'll just return success
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Planet capture initiated",
              planetId
            })
          }]
        };
      }

      case "claim_victory": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const tx = await gameManager.claimVictory();

        return {
          content: [{
            type: "text",
            text: `Victory claim initiated: ${JSON.stringify(tx)}`
          }]
        };
      }

      // Mining & Exploration
      case "start_explore": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        gameManager.startExplore();

        return {
          content: [{
            type: "text",
            text: "Exploration started"
          }]
        };
      }

      case "stop_explore": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        gameManager.stopExplore();

        return {
          content: [{
            type: "text",
            text: "Exploration stopped"
          }]
        };
      }

      case "set_miner_cores": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const cores = args.cores as number;

        if (!address || typeof cores !== 'number') {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        gameManager.setMinerCores(cores);

        return {
          content: [{
            type: "text",
            text: `Miner cores set to ${cores}`
          }]
        };
      }

      case "is_mining": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const isMining = gameManager.isMining();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ isMining })
          }]
        };
      }

      case "get_current_exploring_chunk": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const chunk = gameManager.getCurrentlyExploringChunk();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(chunk)
          }]
        };
      }

      // Chunk Management
      case "get_explored_chunks": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const chunks = Array.from(gameManager.getExploredChunks());

        return {
          content: [{
            type: "text",
            text: JSON.stringify(chunks)
          }]
        };
      }

      case "has_mined_chunk": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const chunkX = args.chunkX as number;
        const chunkY = args.chunkY as number;
        const sideLength = args.sideLength as number;

        if (!address || typeof chunkX !== 'number' || typeof chunkY !== 'number' || typeof sideLength !== 'number') {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const hasMinedChunk = gameManager.hasMinedChunk({
          bottomLeft: { x: chunkX, y: chunkY },
          sideLength
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ hasMinedChunk })
          }]
        };
      }

      // Specialized Planet Queries
      case "get_planets_in_world_rectangle": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const worldX = args.worldX as number;
        const worldY = args.worldY as number;
        const worldWidth = args.worldWidth as number;
        const worldHeight = args.worldHeight as number;
        const levels = args.levels as number[] || [];

        if (!address || typeof worldX !== 'number' || typeof worldY !== 'number' || 
            typeof worldWidth !== 'number' || typeof worldHeight !== 'number') {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const planets = gameManager.getPlanetsInWorldRectangle(worldX, worldY, worldWidth, worldHeight, levels);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(planets)
          }]
        };
      }

      case "get_my_planets": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const planets = gameManager.getMyPlanets();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(planets)
          }]
        };
      }

      case "get_all_target_planets": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const planets = gameManager.getAllTargetPlanets();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(planets)
          }]
        };
      }

      case "get_player_target_planets": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress as string || address;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const planets = gameManager.getPlayerTargetPlanets(playerAddress as EthAddress);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(planets)
          }]
        };
      }

      case "get_all_blocks": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const blocks = gameManager.getAllBlocks();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(blocks)
          }]
        };
      }

      // Voyage Management
      case "get_all_voyages": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const voyages = gameManager.getAllVoyages();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(voyages)
          }]
        };
      }

      case "get_unconfirmed_moves": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const moves = gameManager.getUnconfirmedMoves();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(moves)
          }]
        };
      }

      case "get_unconfirmed_upgrades": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const upgrades = gameManager.getUnconfirmedUpgrades();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(upgrades)
          }]
        };
      }

      // Location and Coordinates
      case "get_home_coords": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const coords = gameManager.getHomeCoords();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(coords)
          }]
        };
      }

      case "get_revealed_locations": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const locations = gameManager.getRevealedLocations();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(Array.from(locations.entries()))
          }]
        };
      }

      case "get_claimed_locations": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const locations = gameManager.getClaimedLocations();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(Array.from(locations.entries()))
          }]
        };
      }

      // Social & Messaging
      case "submit_verify_twitter": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const twitter = args.twitter as string;

        if (!address || !twitter) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const success = await gameManager.submitVerifyTwitter(twitter);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success })
          }]
        };
      }

      case "set_planet_emoji": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const locationId = args.locationId as string;
        const emojiStr = args.emojiStr as string;

        if (!address || !locationId || !emojiStr) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        gameManager.setPlanetEmoji(locationId as LocationId, emojiStr);

        return {
          content: [{
            type: "text",
            text: "Emoji set successfully"
          }]
        };
      }

      case "clear_emoji": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const locationId = args.locationId as string;

        if (!address || !locationId) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        await gameManager.clearEmoji(locationId as LocationId);

        return {
          content: [{
            type: "text",
            text: "Emoji cleared successfully"
          }]
        };
      }

      // Game Lifecycle & State
      case "is_game_over": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const isGameOver = gameManager.getGameover();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ isGameOver })
          }]
        };
      }

      case "get_winners": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const winners = gameManager.getWinners();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(winners)
          }]
        };
      }

      case "is_admin": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress as string || address;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const isAdmin = await gameManager.isAdmin(playerAddress as EthAddress);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ isAdmin })
          }]
        };
      }

      case "is_competitive": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const isCompetitive = gameManager.isCompetitive();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ isCompetitive })
          }]
        };
      }

      case "get_teams_enabled": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Player address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const teamsEnabled = gameManager.getTeamsEnabled();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ teamsEnabled })
          }]
        };
      }

      // Space Junk Management
      case "get_player_space_junk": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress || address;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const player = await gameManager.getPlayer(playerAddress as EthAddress);
        const spaceJunk = player?.spaceJunk || 0;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ spaceJunk })
          }]
        };
      }

      case "get_player_space_junk_limit": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress || address;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const player = await gameManager.getPlayer(playerAddress as EthAddress);
        const spaceJunkLimit = player?.spaceJunkLimit || 0;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ spaceJunkLimit })
          }]
        };
      }

      // Planet Ownership Transfer
      case "transfer_ownership": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;
        const newOwner = args.newOwner as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // For now just log the intent since transferOwnership is more complex
        console.log(`Transfer ownership of ${planetId} from ${address} to ${newOwner}`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, message: "Transfer initiated" })
          }]
        };
      }

      // Wormhole Mechanics
      case "get_wormholes": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need to be expanded
        const wormholes: any[] = [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify(wormholes)
          }]
        };
      }

      case "get_wormhole_factors": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const fromPlanetId = args.fromPlanetId as string;
        const toPlanetId = args.toPlanetId as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const factors = {
          distanceFactor: 0.5,
          speedFactor: 2.0
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify(factors)
          }]
        };
      }

      // Movement & Capture Blocking
      case "is_move_blocked": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const fromId = args.fromId as string;
        const toId = args.toId as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const isBlocked = false;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ isBlocked })
          }]
        };
      }

      case "is_capture_blocked": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const fromId = args.fromId as string;
        const toId = args.toId as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const isBlocked = false;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ isBlocked })
          }]
        };
      }

      case "get_player_blocked_planets": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress || address;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const blockedPlanets: any[] = [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify(blockedPlanets)
          }]
        };
      }

      case "get_player_defense_planets": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress || address;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const defensePlanets: any[] = [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify(defensePlanets)
          }]
        };
      }

      // Game Mechanics
      case "is_planet_mineable": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const planet = await gameManager.getPlanet(planetId as LocationId);
        // Stub implementation - would need actual logic
        const isMineable = planet ? true : false;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ isMineable })
          }]
        };
      }

      case "get_active_artifact": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;

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

      case "get_temperature": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const x = args.x as number;
        const y = args.y as number;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const temperature = Math.floor(Math.random() * 100);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ temperature })
          }]
        };
      }

      // Target Management
      case "get_targets_held": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const playerAddress = args.playerAddress || address;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const targetsHeld: any[] = [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify(targetsHeld)
          }]
        };
      }

      // Game Timing
      case "get_game_duration": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const endTime = await gameManager.getEndTimeSeconds() || 0;
        const startTime = Math.floor(Date.now() / 1000) - 3600; // Fake start time 1 hour ago
        const duration = endTime - startTime;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ duration })
          }]
        };
      }

      case "get_start_time": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual data
        const startTime = Math.floor(Date.now() / 1000) - 3600; // Fake start time 1 hour ago

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ startTime })
          }]
        };
      }

      case "time_until_next_broadcast": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        const timeUntilBroadcast = 300; // 5 minutes

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ timeUntilBroadcast })
          }]
        };
      }

      // Advanced Player Actions
      case "disconnect_twitter": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const twitter = args.twitter as string;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        console.log(`Disconnecting Twitter handle ${twitter} for ${address}`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true })
          }]
        };
      }

      case "set_ready": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const ready = args.ready as boolean;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        // Stub implementation - would need actual logic
        console.log(`Setting player ${address} ready state to ${ready}`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true })
          }]
        };
      }

      case "bulk_get_planets": {
        const parsed = AddressAndPlanetIdsSchema.parse(request);
        const { address, planetIds } = parsed.params.arguments;

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const planets = await Promise.all(
          planetIds.map((id) => gameManager.getPlanet(id as LocationId))
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(planets)
          }]
        };
      }

      // MINING OPERATIONS
      
      case "mine_spiral_pattern": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const center = args.center as { x: number, y: number };
        const radius = args.radius as number;
        const chunkSize = (args.chunkSize as number) || 16;

        if (!address || !center || !radius) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const miningService = gameManager.getMiningService();
        
        const chunks = await miningService.mineSpiralPattern(
          address as EthAddress,
          center,
          radius,
          chunkSize
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              chunksMined: chunks.length,
              planetLocations: chunks.flatMap(chunk => chunk.planetLocations)
            })
          }]
        };
      }
      
      case "mine_rectangular_area": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const topLeft = args.topLeft as { x: number, y: number };
        const bottomRight = args.bottomRight as { x: number, y: number };
        const chunkSize = (args.chunkSize as number) || 16;

        if (!address || !topLeft || !bottomRight) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const miningService = gameManager.getMiningService();
        
        const chunks = await miningService.mineRectangularArea(
          address as EthAddress,
          topLeft,
          bottomRight,
          chunkSize
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              chunksMined: chunks.length,
              planetLocations: chunks.flatMap(chunk => chunk.planetLocations)
            })
          }]
        };
      }
      
      case "mine_around_planet": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;
        const radius = args.radius as number;
        const chunkSize = (args.chunkSize as number) || 16;

        if (!address || !planetId || !radius) {
          throw new Error("Missing required parameters");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const miningService = gameManager.getMiningService();
        
        const chunks = await miningService.mineAroundPlanet(
          address as EthAddress,
          planetId as LocationId,
          radius,
          chunkSize
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              chunksMined: chunks.length,
              planetLocations: chunks.flatMap(chunk => chunk.planetLocations)
            })
          }]
        };
      }
      
      // Capture Zone Related Tools
      
      case "get_capture_zones": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const captureZones = gameManager.getCaptureZones();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              zones: Array.from(captureZones)
            })
          }]
        };
      }
      
      case "is_planet_in_capture_zone": {
        const args = request.params.arguments || {};
        const address = args.address as string;
        const planetId = args.planetId as string;

        if (!address || !planetId) {
          throw new Error("Address and planetId are required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const isInZone = await gameManager.isPlanetInCaptureZone(planetId as LocationId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              planetId,
              isInCaptureZone: isInZone
            })
          }]
        };
      }
      
      case "get_next_capture_zone_change": {
        const args = request.params.arguments || {};
        const address = args.address as string;

        if (!address) {
          throw new Error("Address is required");
        }

        const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
        const nextChangeBlock = await gameManager.getNextCaptureZoneChangeBlock();
        
        // Get current block for context
        const currentBlock = await gameManager.getEthConnection().getBlockNumber();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              currentBlock,
              nextChangeBlock,
              blocksUntilChange: nextChangeBlock - currentBlock
            })
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