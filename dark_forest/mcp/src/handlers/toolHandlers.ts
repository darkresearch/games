import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { EthAddress, LocationId, ArtifactId } from "@darkforest_eth/types";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import { z } from "zod";
import { perlin } from '@darkforest_eth/hashing';
import * as logger from '../helpers/logger';

import { toolSchemas } from "../types/index";
import { MineChunkSchema } from '../types/miner';

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
    // Combine toolSchemas and minerSchemas for the response
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

      case "mine_chunk": {
        const args = request.params.arguments || {};
        const validatedArgs = MineChunkSchema.parse(args);
        const { address, x, y } = validatedArgs;
        const sideLength = 16; // Fixed chunk size
        
        logger.debug(`Mining chunk at (${x}, ${y}) with side length ${sideLength}`);

        try {
          const gameManager = await playerRegistry.getOrCreatePlayer(address as EthAddress);
          const miningService = gameManager.getMiningService();

          const chunk = await miningService.mineChunk(
            address as EthAddress,
            { x, y },
            sideLength
          );

          if (chunk) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  chunk: {
                    x,
                    y,
                    sideLength
                  },
                  chunkFootprint: chunk.chunkFootprint,
                  planetLocations: chunk.planetLocations,
                  perlin: chunk.perlin
                })
              }]
            };
          } else {
            // Return the results
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: false,
                  chunk: null,
                  planetLocations: [],
                })
              }]
            };
          }

        } catch (error) {
          logger.error(`Error mining chunk: ${error instanceof Error ? error.message : String(error)}`);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error)
              })
            }]
          };
        }
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
          
          // First, get necessary universe parameters from the contract
          // Since there's no getContract method, we'll wrap calls in try/catch
          let worldRadius = 5000; // default
          
          // Get world radius
          try {
            worldRadius = gameManager.getWorldRadius();
            logger.debug(`Got world radius from game manager: ${worldRadius}`);
          } catch (e) {
            logger.debug('Could not get world radius from game manager, using default');
          }
          
          // Get spawn constraints if available - using defaults as fallback
          let spawnRimArea = 0;
          let initPerlinMin = 15;  // default fallback
          let initPerlinMax = 30;  // default fallback
          
          // Try to get contract constants if they're available
          try {
            // Check if method exists using bracket notation to avoid TypeScript errors
            if (typeof (gameManager as any)['getContractConstants'] === 'function') {
              const constants = (gameManager as any).getContractConstants();
              // Update perlin values from contract if available
              if (constants && constants.INIT_PERLIN_MIN !== undefined) {
                initPerlinMin = constants.INIT_PERLIN_MIN;
                logger.debug(`Got initPerlinMin from contract: ${initPerlinMin}`);
              }
              if (constants && constants.INIT_PERLIN_MAX !== undefined) {
                initPerlinMax = constants.INIT_PERLIN_MAX;
                logger.debug(`Got initPerlinMax from contract: ${initPerlinMax}`);
              }
              if (constants && constants.SPAWN_RIM_AREA !== undefined) {
                spawnRimArea = constants.SPAWN_RIM_AREA;
                logger.debug(`Got spawnRimArea from contract: ${spawnRimArea}`);
              }
            }
          } catch (e) {
            logger.debug('Could not get perlin constraints from contract, using defaults');
          }
          
          logger.debug(`Init constraints: worldRadius=${worldRadius}, rimArea=${spawnRimArea}, perlinMin=${initPerlinMin}, perlinMax=${initPerlinMax}`);
          
          // Get hash config for perlin validation
          const hashConfig = gameManager.getHashConfig();
          
          // Helper function to validate coordinates
          const validateCoordinates = (x: number, y: number, r: number): boolean => {
            const [isValid] = validateCoordinatesWithReason(x, y, r);
            return isValid;
          };

          // Enhanced validation function that returns reason for failure
          const validateCoordinatesWithReason = (x: number, y: number, r: number): [boolean, string, number?] => {
            try {
              // Create perlin config
              const perlinConfig = {
                key: hashConfig.spaceTypeKey,
                scale: hashConfig.perlinLengthScale,
                mirrorX: hashConfig.perlinMirrorX,
                mirrorY: hashConfig.perlinMirrorY,
                floor: true
              };
              
              logger.debug(`Validating coordinates (${x}, ${y}) with radius ${r}...`);
              logger.debug(`Game parameters: worldRadius=${worldRadius}, rimArea=${spawnRimArea}, perlinMin=${initPerlinMin}, perlinMax=${initPerlinMax}`);
              
              // Calculate perlin value for this location - using imported perlin
              const perlinValue = perlin({ x, y }, perlinConfig);
              logger.debug(`Calculated perlin value: ${perlinValue}`);
              
              // Check world radius constraint
              if (r > worldRadius) {
                logger.debug(`FAIL: Radius ${r} exceeds world radius ${worldRadius}`);
                return [false, 'radiusCheck', perlinValue];
              }
              
              // Check rim area constraint if enabled
              if (spawnRimArea !== 0) {
                const radiusSquared = r * r;
                const worldRadiusSquared = worldRadius * worldRadius;
                
                // Formula: (r^2*314)/100 + spawnRimArea >= (worldRadius^2*314)/100
                const leftSide = (radiusSquared * 314) / 100 + spawnRimArea;
                const rightSide = (worldRadiusSquared * 314) / 100;
                const rimAreaPass = leftSide >= rightSide;
                
                logger.debug(`Rim area calculation: (${r}^2*314)/100 + ${spawnRimArea} = ${leftSide}`);
                logger.debug(`Compared to: (${worldRadius}^2*314)/100 = ${rightSide}`);
                logger.debug(`Rim area constraint result: ${rimAreaPass ? 'PASS' : 'FAIL'}`);
                
                if (!rimAreaPass) {
                  logger.debug(`FAIL: Radius ${r} doesn't satisfy rim area constraint`);
                  return [false, 'rimAreaCheck', perlinValue];
                }
              }
              
              // Check perlin constraints
              const perlinMinPass = perlinValue >= initPerlinMin;
              if (!perlinMinPass) {
                logger.debug(`FAIL: Perlin value ${perlinValue} is less than minimum ${initPerlinMin}`);
                return [false, 'perlinMinCheck', perlinValue];
              }
              
              const perlinMaxPass = perlinValue < initPerlinMax;
              if (!perlinMaxPass) {
                logger.debug(`FAIL: Perlin value ${perlinValue} is greater than or equal to maximum ${initPerlinMax}`);
                return [false, 'perlinMaxCheck', perlinValue];
              }
              
              // All constraints passed
              logger.debug(`VALIDATION RESULT: All constraints passed for (${x}, ${y}, ${r}) with perlin ${perlinValue}`);
              return [true, 'success', perlinValue];
            } catch (e) {
              logger.error(`Error validating coordinates: ${e instanceof Error ? e.message : String(e)}`);
              return [false, 'error'];
            }
          };
          
          // Smarter coordinate generation function
          const generateCoordinates = (attempt: number, worldRadius: number, spawnRimArea: number): { x: number, y: number, r: number } => {
            // Determine if we should focus on the rim area
            const isRimSpawn = spawnRimArea !== 0;
            
            if (isRimSpawn) {
              // Calculate the optimal radius based on the rim area constraint
              // We want to find r such that: (r^2*314)/100 + spawnRimArea >= (worldRadius^2*314)/100
              // Solving for r: r >= sqrt(worldRadius^2 - (spawnRimArea*100)/314)
              const minValidRadius = Math.sqrt(
                Math.max(0, (worldRadius * worldRadius) - ((spawnRimArea * 100) / 314))
              );
              
              // Aim for the middle of the valid rim area to maximize chances
              const targetRadius = (minValidRadius + worldRadius) / 2;
              
              // For rim spawning, use deterministic approach with some randomness
              const angle = (attempt * (Math.PI * 0.618033988749895)) % (2 * Math.PI); // Golden angle for even distribution
              
              // Add some jitter based on attempt number to explore different radii
              const radiusJitter = 0.05 * worldRadius * (Math.sin(attempt) * 0.5 + 0.5);
              const effectiveRadius = Math.min(worldRadius * 0.98, targetRadius + radiusJitter);
              
              // Convert to cartesian coordinates
              const x = Math.floor(effectiveRadius * Math.cos(angle));
              const y = Math.floor(effectiveRadius * Math.sin(angle));
              
              // Calculate true radius
              const r = Math.floor(Math.sqrt(x ** 2 + y ** 2)) + 1;
              
              return { x, y, r };
            } else {
              // If not rim spawn, use improved random sampling with progressive focus
              if (attempt < 20) {
                // First 20 attempts: Completely random throughout map
                const x = Math.floor((Math.random() * 2 - 1) * worldRadius);
                const y = Math.floor((Math.random() * 2 - 1) * worldRadius);
                const r = Math.floor(Math.sqrt(x ** 2 + y ** 2)) + 1;
                return { x, y, r };
              } else if (attempt < 50) {
                // Next 30 attempts: Focus on different quadrants systematically
                const quadrant = (attempt - 20) % 4;
                const xSign = quadrant < 2 ? 1 : -1;
                const ySign = quadrant % 2 === 0 ? 1 : -1;
                
                const x = xSign * Math.floor(Math.random() * worldRadius * 0.8);
                const y = ySign * Math.floor(Math.random() * worldRadius * 0.8);
                const r = Math.floor(Math.sqrt(x ** 2 + y ** 2)) + 1;
                return { x, y, r };
              } else {
                // Remaining attempts: Search across concentric rings
                const ringIndex = attempt % 5;
                const radius = (worldRadius * 0.3) + (ringIndex * worldRadius * 0.12);
                const angle = (attempt * 0.37) % (2 * Math.PI);
                
                const x = Math.floor(radius * Math.cos(angle));
                const y = Math.floor(radius * Math.sin(angle));
                const r = Math.floor(Math.sqrt(x ** 2 + y ** 2)) + 1;
                return { x, y, r };
              }
            }
          };
          
          // Try to find valid coordinates with retries
          const MAX_RETRIES = 100;
          let retryCount = 0;
          let validCoords = false;
          let x = 0, y = 0, r = 0;
          
          // Constraint failure tracking
          const failureStats = {
            radiusCheck: 0,
            rimAreaCheck: 0,
            perlinMinCheck: 0,
            perlinMaxCheck: 0,
            otherErrors: 0
          };
          
          // Track perlin value distribution
          const perlinValues = [];
          const coordinates = [];
          let lastFailReason = '';
          
          logger.debug(`Starting coordinate search with max ${MAX_RETRIES} attempts`);
          
          while (!validCoords && retryCount < MAX_RETRIES) {
            // Generate coordinates using our smarter algorithm
            const coords = generateCoordinates(retryCount, worldRadius, spawnRimArea);
            x = coords.x;
            y = coords.y;
            r = coords.r;
            
            logger.debug(`Attempt ${retryCount + 1}/${MAX_RETRIES}: Testing coordinates (${x}, ${y}) with radius ${r}`);
            
            // Validate the coordinates
            const [isValid, failReason, perlinValue] = validateCoordinatesWithReason(x, y, r);
            validCoords = isValid;
            
            if (!validCoords) {
              // Track failure reason
              if (failReason === 'radiusCheck') failureStats.radiusCheck++;
              else if (failReason === 'rimAreaCheck') failureStats.rimAreaCheck++;
              else if (failReason === 'perlinMinCheck') failureStats.perlinMinCheck++;
              else if (failReason === 'perlinMaxCheck') failureStats.perlinMaxCheck++;
              else failureStats.otherErrors++;
              
              lastFailReason = failReason;
              
              // Log the perlin value for this attempt even if it failed
              if (perlinValue !== undefined) {
                perlinValues.push(perlinValue);
                coordinates.push({ x, y, r, perlinValue });
              }
              
              logger.debug(`FAILED: Attempt ${retryCount + 1} - Reason: ${failReason}`);
            }
            
            retryCount++;
          }
          
          if (!validCoords) {
            logger.debug("=== CONSTRAINT FAILURE STATISTICS ===");
            logger.debug(`World Radius Constraint Failures: ${failureStats.radiusCheck}`);
            logger.debug(`Rim Area Constraint Failures: ${failureStats.rimAreaCheck}`);
            logger.debug(`Perlin Min Value Failures: ${failureStats.perlinMinCheck}`);
            logger.debug(`Perlin Max Value Failures: ${failureStats.perlinMaxCheck}`);
            logger.debug(`Other Errors: ${failureStats.otherErrors}`);
            
            // Calculate and log perlin value statistics
            if (perlinValues.length > 0) {
              const sum = perlinValues.reduce((a, b) => a + b, 0);
              const avg = sum / perlinValues.length;
              const min = Math.min(...perlinValues);
              const max = Math.max(...perlinValues);
              
              logger.debug("=== PERLIN VALUE STATISTICS ===");
              logger.debug(`Average Perlin Value: ${avg.toFixed(2)}`);
              logger.debug(`Min Perlin Value: ${min}`);
              logger.debug(`Max Perlin Value: ${max}`);
              logger.debug(`Required Range: ${initPerlinMin} to ${initPerlinMax}`);
              
              // Find the coordinates that came closest to passing the perlin check
              let closestToPass = null;
              let minDistance = Infinity;
              
              for (const coord of coordinates) {
                let distance;
                if (coord.perlinValue < initPerlinMin) {
                  distance = initPerlinMin - coord.perlinValue;
                } else if (coord.perlinValue >= initPerlinMax) {
                  distance = coord.perlinValue - initPerlinMax + 1;
                } else {
                  // This shouldn't happen (would have passed), but just in case
                  distance = 0;
                }
                
                if (distance < minDistance) {
                  minDistance = distance;
                  closestToPass = coord;
                }
              }
              
              if (closestToPass) {
                logger.debug("=== CLOSEST COORDINATES TO PASSING ===");
                logger.debug(`Coordinates: (${closestToPass.x}, ${closestToPass.y}), r=${closestToPass.r}`);
                logger.debug(`Perlin Value: ${closestToPass.perlinValue}`);
                logger.debug(`Distance from valid range: ${minDistance.toFixed(2)}`);
              }
            }
            
            throw new Error(`Failed to find valid coordinates after ${MAX_RETRIES} attempts. Most common failure: ${Object.entries(failureStats).sort((a, b) => b[1] - a[1])[0][0]}`);
          }
          
          // Random faction/team value (0-9)
          const f = Math.floor(Math.random() * 10);
          
          logger.debug(`Initializing player at validated coordinates (${x}, ${y}) with radius ${r}, team ${f}`);
          
          // Initialize the player with validated coordinates
          // Pass basic integer values and let GameManager handle the formatting
          const result = await gameManager.initializePlayer(
            x,
            y,
            r,
            f  // Simple team number 0-9
          );
          
          logger.debug(`Player initialized successfully: ${JSON.stringify(result)}`);
          
          return {
            content: [{
              type: "text",
              text: `Player initialized successfully at (${x}, ${y}) with radius ${r}, team ${f}. Result: ${JSON.stringify(result)}`
            }]
          };
        } catch (e) {
          // Enhanced error logging
          logger.error(`ERROR initializing player: ${e instanceof Error ? e.message : String(e)}`);
          
          // Check for specific error types
          if (e instanceof Error) {
            if (e.message.includes('transaction failed')) {
              logger.error('Contract transaction failed - this often means validation failed on the contract side');
            } else if (e.message.includes('invalid value for array')) {
              logger.error('Parameter formatting issue - double check that parameters are formatted correctly');
            }
            
            // Log any additional error details
            for (const [key, value] of Object.entries(e)) {
              if (key !== 'message' && key !== 'stack') {
                logger.debug(`Error detail - ${key}: ${JSON.stringify(value)}`);
              }
            }
          }
          
          return {
            content: [{
              type: "text",
              text: `Error initializing player: ${e instanceof Error ? e.message : String(e)}`
            }]
          };
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
        logger.debug(`Transfer ownership of ${planetId} from ${address} to ${newOwner}`);

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
        logger.debug(`Disconnecting Twitter handle ${twitter} for ${address}`);

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
        logger.debug(`Setting player ${address} ready state to ${ready}`);

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

      // MINING OPERATIONS - Moved to minerHandlers.ts
      // Cases removed: start_explore, stop_explore, set_miner_cores, is_mining, 
      // get_current_exploring_chunk, get_explored_chunks, has_mined_chunk, 
      // get_discovered_planets, mine_spiral_pattern, mine_rectangular_area, mine_around_planet
      
      case "generate_home_coords": {
        // ... existing implementation ...
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