import { EthAddress, LocationId, Planet, WorldCoords, WorldLocation } from "@darkforest_eth/types";
import { perlin } from "@darkforest_eth/hashing";
import { GameManager } from "./GameManager";

interface Rectangle {
  bottomLeft: WorldCoords;
  sideLength: number;
}

interface Chunk {
  chunkFootprint: Rectangle;
  planetLocations: LocationId[];
  perlin: number;
}

interface AgentMiningState {
  discoveredChunks: Set<string>; // Serialized chunk footprints
  discoveredPlanets: Set<LocationId>;
}

export enum MiningPatternType {
  Spiral = "SPIRAL",
  Rectangular = "RECTANGULAR",
  RadialAroundPlanet = "RADIAL"
}

// Abstract class for mining patterns
export abstract class MiningPattern {
  abstract type: MiningPatternType;
  abstract nextChunk(chunkSize: number): Rectangle;
  abstract hasNextChunk(): boolean;
  abstract reset(): void;
}

// Spiral mining pattern starting from a center point
export class SpiralPattern extends MiningPattern {
  type = MiningPatternType.Spiral;
  center: WorldCoords;
  currentRing = 0;
  currentSide = 0;
  currentStep = 0;

  constructor(center: WorldCoords) {
    super();
    this.center = center;
  }

  nextChunk(chunkSize: number): Rectangle {
    // Calculate chunk position based on spiral pattern
    const directions = [
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // up
      { x: -1, y: 0 }, // left
      { x: 0, y: -1 }  // down
    ];
    
    let sideLength = this.currentRing * 2;
    if (sideLength === 0) {
      // First chunk is centered
      this.currentRing = 1;
      return {
        bottomLeft: {
          x: this.center.x - chunkSize / 2,
          y: this.center.y - chunkSize / 2
        },
        sideLength: chunkSize
      };
    }
    
    // Calculate position along current ring
    const dir = directions[this.currentSide];
    const steps = this.currentRing * 2;
    
    // Calculate offset from center
    const offsetX = dir.x * this.currentStep * chunkSize;
    const offsetY = dir.y * this.currentStep * chunkSize;
    
    // Calculate bottom left of chunk
    const x = this.center.x + offsetX - chunkSize / 2;
    const y = this.center.y + offsetY - chunkSize / 2;
    
    // Move to next position in spiral
    this.currentStep++;
    if (this.currentStep >= steps) {
      this.currentSide = (this.currentSide + 1) % 4;
      this.currentStep = 0;
      if (this.currentSide === 0) {
        this.currentRing++;
      }
    }
    
    return {
      bottomLeft: { x, y },
      sideLength: chunkSize
    };
  }

  hasNextChunk(): boolean {
    return true; // Spiral pattern can continue indefinitely
  }

  reset(): void {
    this.currentRing = 0;
    this.currentSide = 0;
    this.currentStep = 0;
  }
}

// Rectangular pattern mining in a specified area
export class RectangularPattern extends MiningPattern {
  type = MiningPatternType.Rectangular;
  topLeft: WorldCoords;
  bottomRight: WorldCoords;
  currentX: number;
  currentY: number;

  constructor(topLeft: WorldCoords, bottomRight: WorldCoords) {
    super();
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
    this.currentX = topLeft.x;
    this.currentY = topLeft.y;
  }

  nextChunk(chunkSize: number): Rectangle {
    const bottomLeft = {
      x: this.currentX,
      y: this.currentY
    };
    
    // Move to next position
    this.currentX += chunkSize;
    if (this.currentX >= this.bottomRight.x) {
      this.currentX = this.topLeft.x;
      this.currentY += chunkSize;
    }
    
    return {
      bottomLeft,
      sideLength: chunkSize
    };
  }

  hasNextChunk(): boolean {
    return this.currentY < this.bottomRight.y;
  }

  reset(): void {
    this.currentX = this.topLeft.x;
    this.currentY = this.topLeft.y;
  }
}

// Radial pattern mining around a planet
export class RadialPattern extends MiningPattern {
  type = MiningPatternType.RadialAroundPlanet;
  center: WorldCoords;
  radius: number;
  currentRing: number;
  currentAngle: number;
  angleStep: number;

  constructor(center: WorldCoords, radius: number) {
    super();
    this.center = center;
    this.radius = radius;
    this.currentRing = 0;
    this.currentAngle = 0;
    this.angleStep = Math.PI / 8; // 22.5 degrees
  }

  nextChunk(chunkSize: number): Rectangle {
    if (this.currentRing === 0) {
      // First chunk is centered
      this.currentRing = 1;
      return {
        bottomLeft: {
          x: this.center.x - chunkSize / 2,
          y: this.center.y - chunkSize / 2
        },
        sideLength: chunkSize
      };
    }
    
    // Calculate position based on current angle and ring
    const ringRadius = this.currentRing * chunkSize;
    const x = this.center.x + Math.cos(this.currentAngle) * ringRadius - chunkSize / 2;
    const y = this.center.y + Math.sin(this.currentAngle) * ringRadius - chunkSize / 2;
    
    // Move to next angle
    this.currentAngle += this.angleStep;
    if (this.currentAngle >= Math.PI * 2) {
      this.currentAngle = 0;
      this.currentRing++;
    }
    
    return {
      bottomLeft: { x, y },
      sideLength: chunkSize
    };
  }

  hasNextChunk(): boolean {
    // Stop when we've reached the desired radius
    return this.currentRing * this.angleStep <= this.radius;
  }

  reset(): void {
    this.currentRing = 0;
    this.currentAngle = 0;
  }
}

/**
 * MiningService handles mining operations for agents
 */
export class MiningService {
  private gameManager: GameManager;
  private agentMiningState: Map<EthAddress, AgentMiningState>;
  private worldRadius: number;
  private planetRarity: number;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
    this.agentMiningState = new Map();
    this.worldRadius = gameManager.getWorldRadius();
    this.planetRarity = 16000; // Default value, should be retrieved from contract
  }

  /**
   * Gets or creates the mining state for an agent
   */
  private getAgentState(agentId: EthAddress): AgentMiningState {
    let state = this.agentMiningState.get(agentId);
    if (!state) {
      state = {
        discoveredChunks: new Set(),
        discoveredPlanets: new Set()
      };
      this.agentMiningState.set(agentId, state);
    }
    return state;
  }

  /**
   * Mine using a spiral pattern around a center point
   */
  async mineSpiralPattern(
    agentId: EthAddress,
    center: WorldCoords,
    radius: number,
    chunkSize: number = 16
  ): Promise<Chunk[]> {
    const pattern = new SpiralPattern(center);
    return this.minePattern(agentId, pattern, radius, chunkSize);
  }

  /**
   * Mine a rectangular area defined by two points
   */
  async mineRectangularArea(
    agentId: EthAddress,
    topLeft: WorldCoords,
    bottomRight: WorldCoords,
    chunkSize: number = 16
  ): Promise<Chunk[]> {
    const pattern = new RectangularPattern(topLeft, bottomRight);
    return this.minePattern(agentId, pattern, 0, chunkSize);
  }

  /**
   * Mine in a radial pattern around a planet
   */
  async mineAroundPlanet(
    agentId: EthAddress,
    planetId: LocationId,
    radius: number,
    chunkSize: number = 16
  ): Promise<Chunk[]> {
    // Get planet location
    const planet = await this.gameManager.getPlanet(planetId);
    if (!planet) {
      throw new Error(`Planet ${planetId} not found`);
    }
    
    // Since our GameManager might not have getLocationOfPlanet method,
    // we'll create a default center position or use a coordinate system
    // that makes sense for our game
    let center: WorldCoords;
    
    // Try to get coordinates from the planet if possible
    if ((planet as any).location?.coords) {
      center = (planet as any).location.coords;
    } else {
      // Default to using random coordinates as a fallback
      center = {
        x: Math.random() * this.worldRadius * 2 - this.worldRadius,
        y: Math.random() * this.worldRadius * 2 - this.worldRadius
      };
    }
    
    const pattern = new RadialPattern(center, radius);
    return this.minePattern(agentId, pattern, radius, chunkSize);
  }

  /**
   * Core mining logic - Mines chunks according to the given pattern
   */
  private async minePattern(
    agentId: EthAddress,
    pattern: MiningPattern,
    radius: number,
    chunkSize: number
  ): Promise<Chunk[]> {
    const agentState = this.getAgentState(agentId);
    const discoveredChunks: Chunk[] = [];
    
    // Limit how many chunks we process per call to prevent timeouts
    const maxChunks = radius > 0 ? Math.ceil(radius / chunkSize) * 8 : 100;
    let chunksProcessed = 0;
    
    while (pattern.hasNextChunk() && chunksProcessed < maxChunks) {
      const chunkRect = pattern.nextChunk(chunkSize);
      
      // Check if this chunk is within world bounds
      const distFromCenter = Math.sqrt(
        chunkRect.bottomLeft.x ** 2 + chunkRect.bottomLeft.y ** 2
      );
      
      if (distFromCenter > this.worldRadius) {
        continue; // Skip chunks outside world radius
      }
      
      // Check if we've already mined this chunk
      const chunkKey = `${chunkRect.bottomLeft.x},${chunkRect.bottomLeft.y},${chunkSize}`;
      if (agentState.discoveredChunks.has(chunkKey)) {
        continue;
      }
      
      // Mine the chunk
      const chunk = this.mineChunk(chunkRect);
      
      // Mark planets as discovered
      chunk.planetLocations.forEach(planetId => {
        agentState.discoveredPlanets.add(planetId);
      });
      
      // Mark chunk as discovered
      agentState.discoveredChunks.add(chunkKey);
      
      // Add to results
      discoveredChunks.push(chunk);
      chunksProcessed++;
    }
    
    return discoveredChunks;
  }

  /**
   * Mines a single chunk for planets
   */
  private mineChunk(chunkRect: Rectangle): Chunk {
    const planetLocations: LocationId[] = [];
    
    // In a real implementation, we would use the proper hashing algorithm
    // For now, we'll use a simplified approach to generate planet IDs
    
    // Generate some pseudo-random planets in the chunk
    const chunkPerlin = perlin(
      {
        x: chunkRect.bottomLeft.x,
        y: chunkRect.bottomLeft.y
      },
      {
        scale: 1,
        key: 1,
        mirrorX: false,
        mirrorY: false,
        floor: false
      }
    );
    
    // The number of planets should be based on planet rarity
    const numPlanets = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numPlanets; i++) {
      // Generate random coordinates within the chunk
      const x = chunkRect.bottomLeft.x + Math.random() * chunkRect.sideLength;
      const y = chunkRect.bottomLeft.y + Math.random() * chunkRect.sideLength;
      
      // In a real implementation, we would hash these coordinates
      // For now, create a deterministic locationId based on coordinates
      const locationId = `0x${(x * 1000000 + y).toString(16).padStart(64, '0')}` as LocationId;
      
      planetLocations.push(locationId);
      
      // Create a basic planet at this location if it doesn't exist
      this.createOrUpdatePlanet(locationId, { x, y });
    }
    
    return {
      chunkFootprint: chunkRect,
      planetLocations,
      perlin: chunkPerlin
    };
  }

  /**
   * Creates or updates a planet in the game state
   */
  private createOrUpdatePlanet(locationId: LocationId, coords: WorldCoords): void {
    // In a real implementation, we would add this to GameManager's planets map
    // and properly initialize it with correct data
    
    // For now, we'll just simulate the discovery
    // Logic would go here to add to GameManager's state
  }

  /**
   * Gets all planets discovered by an agent
   */
  getDiscoveredPlanets(agentId: EthAddress): LocationId[] {
    const state = this.getAgentState(agentId);
    return Array.from(state.discoveredPlanets);
  }

  /**
   * Gets all chunks discovered by an agent
   */
  getDiscoveredChunks(agentId: EthAddress): string[] {
    const state = this.getAgentState(agentId);
    return Array.from(state.discoveredChunks);
  }

  /**
   * Clears mining data for an agent
   */
  clearAgentData(agentId: EthAddress): void {
    this.agentMiningState.delete(agentId);
  }
} 