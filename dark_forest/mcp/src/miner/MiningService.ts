import { EthAddress, LocationId, WorldCoords, Chunk, PerlinConfig, WorldLocation, Rectangle } from "@darkforest_eth/types";
import { mimcHash, perlin } from "@darkforest_eth/hashing";
import { locationIdFromBigInt } from "@darkforest_eth/serde";
import { GameManager } from "../GameManager";
import { PlayerRegistry } from "../registry/PlayerRegistry";
import bigInt from "big-integer";
import { getBytesFromHex } from "@darkforest_eth/hexgen";

// Constant from client
const LOCATION_ID_UB = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

/**
 * Simplified MiningService that handles mining single chunks using proper DF hashing
 */
export class MiningService {
  private gameManager: GameManager;
  private playerRegistry: PlayerRegistry;
  private worldRadius: number;
  private planetRarity: number;
  private planetHashKey: number;
  private spaceTypeKey: number;
  private biomebaseKey: number;
  private perlinLengthScale: number;
  private perlinMirrorX: boolean;
  private perlinMirrorY: boolean;
  private planetLevelThresholds: number[];

  constructor(gameManager: GameManager, playerRegistry: PlayerRegistry) {
    this.gameManager = gameManager;
    this.playerRegistry = playerRegistry;
    this.worldRadius = gameManager.getWorldRadius();
    
    // Get hash config from game manager
    const hashConfig = gameManager.getHashConfig();
    this.planetRarity = hashConfig.planetRarity;
    this.planetHashKey = hashConfig.planetHashKey;
    this.spaceTypeKey = hashConfig.spaceTypeKey;
    this.biomebaseKey = hashConfig.biomeBaseKey;
    this.perlinLengthScale = hashConfig.perlinLengthScale;
    this.perlinMirrorX = hashConfig.perlinMirrorX;
    this.perlinMirrorY = hashConfig.perlinMirrorY;
    
    // TODO: Get these from game config
    this.planetLevelThresholds = [16, 32, 48, 64, 80, 96, 112, 128, 144, 160];
  }

  /**
   * Mine a single chunk at specified coordinates.
   * Returns the mined chunk or null if the chunk couldn't be mined
   * (e.g. outside world radius or already mined).
   */
  async mineChunk(
    agentId: EthAddress,
    center: WorldCoords,
    sideLength: number = 16
  ): Promise<Chunk | null> {
    // Check if this chunk is within world bounds
    const distFromCenter = Math.sqrt(center.x ** 2 + center.x ** 2);
    if (distFromCenter > this.worldRadius) {
      // Skip chunks outside world radius
      return null;
    }
    
    // Create the chunk rectangle
    const bottomLeft = {
        x: center.x - sideLength / 2,
        y: center.y - sideLength / 2
    };
    const chunkRect: Rectangle = {
      bottomLeft: bottomLeft,
      sideLength
    };
    
    // Check if we've already mined this chunk
    const chunkKey = `${chunkRect.bottomLeft.x},${chunkRect.bottomLeft.y},${sideLength}`;
    if (this.playerRegistry.hasDiscoveredChunk(agentId, chunkKey)) {
      return null; // Already mined this chunk
    }
    
    // Mine the chunk using proper DF hashing
    const chunk = this.generateChunk(chunkRect);
    
    // Mark planets as discovered in the player registry
    chunk.planetLocations.forEach(location => {
      this.playerRegistry.addDiscoveredPlanet(agentId, location.hash);
    });
    
    // Mark chunk as discovered in the player registry
    this.playerRegistry.addDiscoveredChunk(agentId, chunkKey);
    
    return {
      chunkFootprint: chunkRect,
      planetLocations: chunk.planetLocations,
      perlin: chunk.perlin
    };
  }

  /**
   * Generates planet data for a chunk using proper DF hashing algorithm
   */
  private generateChunk(chunkRect: Rectangle): {
    planetLocations: WorldLocation[];
    perlin: number;
  } {
    const planetHashFn = mimcHash(this.planetHashKey);
    const spaceTypePerlinOpts: PerlinConfig = {
      key: this.spaceTypeKey,
      scale: this.perlinLengthScale,
      mirrorX: this.perlinMirrorX,
      mirrorY: this.perlinMirrorY,
      floor: true,
    };
    const biomebasePerlinOpts: PerlinConfig = {
      key: this.biomebaseKey,
      scale: this.perlinLengthScale,
      mirrorX: this.perlinMirrorX,
      mirrorY: this.perlinMirrorY,
      floor: true,
    };

    const planetLocations: WorldLocation[] = [];
    const { x: bottomLeftX, y: bottomLeftY } = chunkRect.bottomLeft;
    const { sideLength } = chunkRect;
    
    // Fixed planetRarityBI calculation
    const planetRarityBI = bigInt(this.planetRarity);
    
    // Iterate through every coordinate in the chunk
    for (let x = bottomLeftX; x < bottomLeftX + sideLength; x++) {
      for (let y = bottomLeftY; y < bottomLeftY + sideLength; y++) {
        const hash = planetHashFn(x, y);
        
        // Check if this location contains a planet based on hash
        if (hash.lesser(LOCATION_ID_UB.divide(planetRarityBI))) {
          // Convert hash to locationId
          const locationId = locationIdFromBigInt(hash);
          
          // Check if planet level is below level 0 threshold (just like in client code)
          if (!this.planetLevelBelowLevel0Threshold(locationId)) {
            continue;
          }
          
          // Calculate perlin values for space type and biome
          const spacePerlin = perlin({ x, y }, spaceTypePerlinOpts);
          const biomePerlin = perlin({ x, y }, biomebasePerlinOpts);
          
          planetLocations.push({
            coords: { x, y },
            hash: locationId,
            perlin: spacePerlin,
            biomebase: biomePerlin,
          });
        }
      }
    }

    // Calculate perlin value for chunk center
    const chunkCenter = {
      x: chunkRect.bottomLeft.x + chunkRect.sideLength / 2,
      y: chunkRect.bottomLeft.y + chunkRect.sideLength / 2,
    };
    
    return {
      planetLocations,
      perlin: perlin(chunkCenter, { ...spaceTypePerlinOpts, floor: false }),
    };
  }
  
  /**
   * Checks if a planet's level is below the level 0 threshold
   * Uses the same logic as the client code
   */
  private planetLevelBelowLevel0Threshold(locationId: LocationId): boolean {
    const levelBigInt = getBytesFromHex(locationId, 4, 7);
    // Threshold [0] is the largest number. This matches client logic.
    return levelBigInt.lesser(bigInt(this.planetLevelThresholds[0]));
  }
} 