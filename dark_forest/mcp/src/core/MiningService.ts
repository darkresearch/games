import { EthAddress, LocationId, WorldCoords, Chunk, PerlinConfig, WorldLocation, Rectangle } from "@darkforest_eth/types";
import { mimcHash, perlin } from "@darkforest_eth/hashing";
import { locationIdFromBigInt } from "@darkforest_eth/serde";
import { GameManager } from "./GameManager";
import { PlayerRegistry } from "./PlayerRegistry";
import bigInt from "big-integer";
import { getBytesFromHex } from "@darkforest_eth/hexgen";
import { LOCATION_ID_UB } from "../config";
import * as logger from '../helpers/logger';

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
    this.planetLevelThresholds = hashConfig.planetLevelThresholds;
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
    logger.debug(`[mineChunk()] Mining chunk at (${center.x}, ${center.y}) with side length ${sideLength}`);

    // Check if this chunk is within world bounds
    const distFromCenter = Math.sqrt(center.x ** 2 + center.y ** 2);
    logger.debug(`[mineChunk()] World radius: ${this.worldRadius}`);
    logger.debug(`[mineChunk()] Distance from center: ${distFromCenter}`);

    if (distFromCenter > this.worldRadius) {
      // Skip chunks outside world radius
      logger.debug(`[mineChunk()] Chunk is outside world radius`);
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
    logger.debug(`[mineChunk()] Chunk rectangle: ${JSON.stringify(chunkRect)}`);

    // Check if we've already mined this chunk
    const chunkKey = `${chunkRect.bottomLeft.x},${chunkRect.bottomLeft.y},${sideLength}`;
    if (this.playerRegistry.hasDiscoveredChunk(agentId, chunkKey)) {
      return null; // Already mined this chunk
    }
    
    // Mine the chunk using proper DF hashing
    const chunk = this.generateChunk(chunkRect, center);
    
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
  private generateChunk(chunkRect: Rectangle, center: WorldCoords): {
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

    let planetLocations: WorldLocation[] = [];
    const planetRarityBI = bigInt(this.planetRarity);
    const { x: bottomLeftX, y: bottomLeftY } = chunkRect.bottomLeft;
    const { sideLength } = chunkRect;
    for (let x = bottomLeftX; x < bottomLeftX + sideLength; x++) {
        for (let y = bottomLeftY; y < bottomLeftY + sideLength; y++) {
            const hash = planetHashFn(x, y);
            if (hash.lesser(LOCATION_ID_UB.divide(planetRarityBI))) {
                // if planet bytes 4-6 are too high for planet threshold, don't render on client.
                if (
                    !this.planetLevelBelowLevel0Threshold(
                        locationIdFromBigInt(hash), 
                        this.planetLevelThresholds
                    )
                ) continue;

                planetLocations.push({
                    coords: { x, y },
                    hash: locationIdFromBigInt(hash),
                    perlin: perlin({ x, y }, spaceTypePerlinOpts),
                    biomebase: perlin({ x, y }, biomebasePerlinOpts),
                });
            }
        
        }
    }

    const chunkCenter = {
      x: center.x,
      y: center.y,
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
  private planetLevelBelowLevel0Threshold(
    hex: LocationId,
    thresholds: number[]
  ): boolean {
    const levelBigInt = getBytesFromHex(hex, 4, 7);
    // Threshold [0] is the largest number.
    return levelBigInt < bigInt(thresholds[0]);
  }
} 
