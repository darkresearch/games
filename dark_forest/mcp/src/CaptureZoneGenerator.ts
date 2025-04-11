import { EventEmitter } from "events";
import { monomitter, Monomitter } from "@darkforest_eth/events";
import { CaptureZone, LocationId, WorldCoords } from "@darkforest_eth/types";
import { GameManager } from "./GameManager";

/**
 * Event emitted when new capture zones are generated
 */
export interface CaptureZonesGeneratedEvent {
  changeBlock: number;
  nextChangeBlock: number;
  zones: Set<CaptureZone>;
}

/**
 * CaptureZoneGenerator creates dynamic capture zones in the universe that change periodically
 * based on blockchain block numbers. These zones are critical for competitive gameplay.
 */
export class CaptureZoneGenerator extends EventEmitter {
  private readonly gameManager: GameManager;
  private readonly gameStartBlock: number;
  private readonly zoneChangeInterval: number;
  private lastZoneChangeBlock: number = 0;
  private currentZones: Set<CaptureZone>;
  private readonly MAX_ZONE_RADIUS = 5000; // Maximum radius for a capture zone
  private readonly ZONES_PER_CHANGE = 3; // Number of zones generated each change
  
  // Event emitter for when new zones are generated
  public readonly generated$: Monomitter<CaptureZonesGeneratedEvent>;

  /**
   * Create a new CaptureZoneGenerator
   */
  constructor(
    gameManager: GameManager, 
    gameStartBlock: number, 
    zoneChangeInterval: number
  ) {
    super();
    this.gameManager = gameManager;
    this.gameStartBlock = gameStartBlock;
    this.zoneChangeInterval = zoneChangeInterval;
    this.currentZones = new Set();
    this.generated$ = monomitter<CaptureZonesGeneratedEvent>();
  }

  /**
   * Generate new capture zones based on the current block number
   * @param currentBlock Current blockchain block number
   */
  public generate(currentBlock: number): void {
    // Determine if we need to generate new zones
    // First generation happens at game start block
    if (currentBlock < this.gameStartBlock) {
      return; // Game hasn't started yet
    }

    // Calculate which change number we're on
    const blocksAfterStart = currentBlock - this.gameStartBlock;
    const changeNumber = Math.floor(blocksAfterStart / this.zoneChangeInterval);
    const changeBlock = this.gameStartBlock + (changeNumber * this.zoneChangeInterval);
    
    // If we've already generated zones for this change block, don't regenerate
    if (changeBlock <= this.lastZoneChangeBlock) {
      return;
    }
    
    // Generate new zones
    this.lastZoneChangeBlock = changeBlock;
    this.currentZones = this.generateZones(changeBlock);
    
    // Calculate the next block where zones will change
    const nextChangeBlock = changeBlock + this.zoneChangeInterval;
    
    // Emit event
    const event: CaptureZonesGeneratedEvent = {
      changeBlock,
      nextChangeBlock,
      zones: this.currentZones
    };
    
    this.emit("zonesGenerated", event);
    this.generated$.publish(event);
  }

  /**
   * Generate a set of capture zones based on the given block number as seed
   * @param blockNumber Block number to use as seed for zone generation
   * @returns Set of CaptureZone objects
   */
  private generateZones(blockNumber: number): Set<CaptureZone> {
    const zones = new Set<CaptureZone>();
    const worldRadius = this.gameManager.getWorldRadius();
    
    // Use block number as seed for pseudo-random generation
    const seed = blockNumber;
    
    // Generate multiple distinct zones
    for (let i = 0; i < this.ZONES_PER_CHANGE; i++) {
      // Create a deterministic but seemingly random value from seed and index
      const randomSeed = this.mulberry32(seed + i * 1000);
      
      // Generate coordinates within world radius (but not too close to edge)
      const maxCoord = worldRadius * 0.8;
      const x = (randomSeed() * 2 - 1) * maxCoord;
      const y = (randomSeed() * 2 - 1) * maxCoord;
      
      // Determine zone radius (varying sizes)
      const minRadius = worldRadius * 0.05; // At least 5% of world radius
      const maxRadius = Math.min(worldRadius * 0.15, this.MAX_ZONE_RADIUS); // Max 15% of world radius
      const radius = minRadius + randomSeed() * (maxRadius - minRadius);
      
      // Create zone - note: if CaptureZone type doesn't have zoneName, we'll create
      // a custom zone with the properties we need
      const zone: CaptureZone = {
        coords: { x, y },
        radius,
        // Custom properties can be added if needed
        // We'll remove 'zoneName' as it's not in the CaptureZone type
      };
      
      zones.add(zone);
    }
    
    return zones;
  }

  /**
   * Simple deterministic pseudo-random number generator
   * @param seed Seed for random number generation
   * @returns Function that produces random numbers between 0 and 1
   */
  private mulberry32(seed: number): () => number {
    return function() {
      let z = (seed += 0x6D2B79F5);
      z = Math.imul(z ^ (z >>> 15), 1 | z);
      z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Check if a planet is within any capture zone
   * @param locationId ID of the planet to check
   * @returns True if planet is in a capture zone
   */
  public async isInZone(locationId: LocationId): Promise<boolean> {
    const planet = await this.gameManager.getPlanet(locationId);
    if (!planet) return false;
    
    // We need to handle planet coordinates
    // In our implementation, we need to adapt to how coordinates are stored
    // Let's use a more flexible approach
    const coords = await this.getPlanetCoords(locationId);
    if (!coords) return false;
    
    return this.isCoordInZone(coords);
  }

  /**
   * Helper to get planet coordinates safely
   */
  private async getPlanetCoords(locationId: LocationId): Promise<WorldCoords | undefined> {
    const planet = await this.gameManager.getPlanet(locationId);
    if (!planet) return undefined;
    
    // Different implementations might store coordinates differently
    // This makes it more flexible
    if ((planet as any).location?.coords) {
      return (planet as any).location.coords;
    }
    
    // Check our known properties
    if ((planet as any).coords) {
      return (planet as any).coords;
    }
    
    return undefined;
  }

  /**
   * Check if coordinates are within any capture zone
   * @param coords Coordinates to check
   * @returns True if coordinates are in a zone
   */
  public isCoordInZone(coords: WorldCoords): boolean {
    for (const zone of this.currentZones) {
      const distance = this.getDistance(coords, zone.coords);
      if (distance <= zone.radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the Euclidean distance between two coordinates
   * @param a First coordinate
   * @param b Second coordinate
   * @returns Distance between coordinates
   */
  private getDistance(a: WorldCoords, b: WorldCoords): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  /**
   * Get all current capture zones
   * @returns Set of current CaptureZone objects
   */
  public getZones(): Set<CaptureZone> {
    return this.currentZones;
  }

  /**
   * Get the next block number when zones will change
   * @param currentBlock Current block number
   * @returns Block number of next zone change
   */
  public getNextChangeBlock(currentBlock: number): number {
    if (currentBlock < this.gameStartBlock) {
      return this.gameStartBlock;
    }
    
    const blocksAfterStart = currentBlock - this.gameStartBlock;
    const changeNumber = Math.floor(blocksAfterStart / this.zoneChangeInterval);
    const nextChangeBlock = this.gameStartBlock + ((changeNumber + 1) * this.zoneChangeInterval);
    
    return nextChangeBlock;
  }

  /**
   * Find the capture zone that contains the given coordinates
   * @param coords Coordinates to check
   * @returns The capture zone containing the coordinates, or undefined if not in a zone
   */
  public getZoneContainingCoord(coords: WorldCoords): CaptureZone | undefined {
    for (const zone of this.currentZones) {
      const distance = this.getDistance(coords, zone.coords);
      if (distance <= zone.radius) {
        return zone;
      }
    }
    return undefined;
  }
} 