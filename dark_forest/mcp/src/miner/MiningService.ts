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
    // const hashConfig = gameManager.getHashConfig();
    
    this.planetRarity = 7000;
    this.planetHashKey = 69;
    this.spaceTypeKey = 69;
    this.biomebaseKey = 69;
    this.perlinLengthScale = 512;
    this.perlinMirrorX = false;
    this.perlinMirrorY = false;
    
    // TODO: Get these from game config
    this.planetLevelThresholds = [8194293, 4194292, 1048561, 262128, 65520, 16368, 4080, 1008, 240, 48];
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
  /**
   * 
   * OPEN QUESTIONS:
   * 1. is the planet hashkey correct?
   * 2. Are all the spaceTypePerlinOpts and biomebasePerlinOpts
   *    correct?
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
    let count = 0;
    const { x: bottomLeftX, y: bottomLeftY } = chunkRect.bottomLeft;
    const { sideLength } = chunkRect;
    for (let x = bottomLeftX; x < bottomLeftX + sideLength; x++) {
        for (let y = bottomLeftY; y < bottomLeftY + sideLength; y++) {
            const hash = planetHashFn(x, y);
            if (hash.lesser(LOCATION_ID_UB.divide(planetRarityBI))) {
                // if planet bytes 4-6 are too high for planet threshold, don't render on client.
                // if (
                //     !this.planetLevelBelowLevel0Threshold(
                //         locationIdFromBigInt(hash), 
                //         this.planetLevelThresholds
                //     )
                // ) continue;

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
