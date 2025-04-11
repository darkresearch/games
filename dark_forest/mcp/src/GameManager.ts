import { EthConnection } from "@darkforest_eth/network";
import { 
  EthAddress, 
  LocationId, 
  Planet, 
  Player, 
  Artifact,
  ArtifactId,
  WorldCoords,
  EthTxStatus,
  TxIntent,
  TransactionId,
  PlanetType,
  PlanetLevel,
  SpaceType,
  ArtifactRarity,
  Upgrade,
  WorldLocation,
  VoyageId,
  QueuedArrival,
  ArtifactType,
  UnconfirmedMove,
  UnconfirmedUpgrade,
  UnconfirmedActivateArtifact,
  UnconfirmedPlanetTransfer,
  Wormhole,
  Biome,
  UpgradeState
} from "@darkforest_eth/types";
import { providers, BigNumber, Contract, Overrides } from "ethers";
import { EventEmitter } from "events";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { isLocatable, isSpaceShip, getRange, isActivated, timeUntilNextBroadcastAvailable } from '@darkforest_eth/gamelogic';
import { getPlanetName } from '@darkforest_eth/procedural';
import { perlin } from "@darkforest_eth/hashing";
import fs from 'fs';
import path from 'path';
// Replace the static import with a declaration and dynamic import later
// import DarkForestABI from "@darkforest_eth/contracts/abis/DarkForest.json" with { type: 'json' };
// We'll use a dynamic approach to load the ABI
let DarkForestABI: any;
import { MiningService } from "./MiningService";
import { CaptureZoneGenerator, CaptureZonesGeneratedEvent } from "./CaptureZoneGenerator";

/**
 * MCP IMPLEMENTATION NOTES:
 * 
 * This GameManager implementation provides core game functionality for the MCP (Model Context Protocol) server,
 * adapting the original Dark Forest client-side GameManager for server-side use. Some features have been
 * intentionally omitted as they are not needed in the MCP context:
 * 
 * Skipped Social/UI Features:
 * - Twitter Integration: All twitter-related functionality (getTwitter, verifyTwitterHandle, submitVerifyTwitter)
 *   Reason: Social media integration is client-side UI concern
 * 
 * - Planet Messaging System: Planet messages and emoji functionality
 *   Reason: These are purely cosmetic UI features
 * 
 * - UI Notification System: The NotificationManager events and UI updates
 *   Reason: MCP doesn't need UI notifications
 * 
 * - Terminal Output: All terminal printing functionality
 *   Reason: Terminal is client-side UI component
 * 
 * Other Skipped Features:
 * - Plugin System: The loadPlugins/savePlugins functionality
 *   Reason: Plugins are client-side extensions
 * 
 * - UI Event Emitters: Various UI-specific event emitters
 *   Reason: MCP doesn't have a UI
 * 
 * - Client-side Streaming: Real-time data streaming to UI components
 *   Reason: MCP uses request/response model
 * 
 * Added MCP-specific Features:
 * - Multi-agent Mining Support: Server-side mining that supports multiple agents
 *   Reason: MCP needs to mine on behalf of different agents
 * 
 * - Capture Zone Generation: Dynamic capture zone generation based on blockchain blocks
 *   Reason: Critical gameplay feature for competitive modes
 */

// Define enum for transaction status with actual values
export enum EthTxStatus {
  Queued = 0,
  Init = 1,
  Submit = 2,
  Confirm = 3,
  Complete = 4,
  Fail = 5
}

// Transaction interface
interface Transaction<T extends TxIntent = TxIntent> {
  id: TransactionId;
  intent: T;
  status: EthTxStatus;
  hash?: string;
  submittedAt?: number;
  confirmedAt?: number;
  createdAt: number;
}

// Game manager events
export enum GameManagerEvent {
  PlanetUpdate = 'PlanetUpdate',
  PlayerUpdate = 'PlayerUpdate',
  ArtifactUpdate = 'ArtifactUpdate',
  TransactionUpdate = 'TransactionUpdate',
  DiscoveredNewChunk = 'DiscoveredNewChunk',
  PlayersUpdated = 'PlayersUpdated'
}

// Interfaces for chunk management
interface Chunk {
  chunkFootprint: Rectangle;
  planetLocations: LocationId[];
  perlin: number;
}

interface Rectangle {
  bottomLeft: WorldCoords;
  sideLength: number;
}

interface RevealedLocation {
  hash: LocationId;
  location: WorldLocation;
  revealer: EthAddress;
}

// Interface for wormhole configuration
interface WormholeConfiguration {
  isOpen: boolean;
  toLocationId: LocationId;
  fromLocationId: LocationId;
  expiration: number;
}

// Interface for hash configuration
interface HashConfig {
  planetHashKey: number;
  spaceTypeKey: number;
  biomeBaseKey: number;
  perlinLengthScale: number;
  perlinMirrorX: boolean;
  perlinMirrorY: boolean;
  planetRarity: number;
}

// Define a custom planet type that matches the fields we populate in our implementation
interface ManagedPlanet extends Partial<Planet> {
  locationId: LocationId;
  perlin: number;
  owner: EthAddress;
  planetLevel: PlanetLevel;
  planetType: PlanetType;
  isHomePlanet: boolean;
  spaceType: SpaceType;
  hasTriedFindingArtifact: boolean;
  energyCap: number;
  energyGrowth: number;
  silverCap: number;
  silverGrowth: number;
  energy: number;
  silver: number;
  range: number;
  speed: number;
  defense: number;
  spaceJunk: number;
  lastUpdated: number;
  upgradeState: [number, number, number]; // Explicitly typed as a tuple with 3 elements
  unconfirmedDepartures: any[];
  unconfirmedUpgrades: any[];
  unconfirmedBuyHats: any[];
  unconfirmedPlanetTransfers: any[];
  heldArtifactIds: ArtifactId[];
  coordsRevealed: boolean;
  revealer: EthAddress;
  location?: WorldLocation;
}

// Define a custom artifact type that matches the fields we populate in our implementation
interface ManagedArtifact extends Partial<Artifact> {
  id: ArtifactId;
  planetDiscoveredOn: LocationId;
  rarity: ArtifactRarity;
  planetBiome: Biome; // Use Biome instead of SpaceType
  mintedAtTimestamp: number;
  discoverer: EthAddress;
  artifactType: ArtifactType;
  controller: EthAddress;
  currentOwner: EthAddress;
  activations: number;
  lastActivated: number;
  lastDeactivated: number;
  wormholeTo: LocationId | null;
  onPlanetId: LocationId;
  isInititalized: boolean;
  upgrade: Upgrade | undefined;
  timeDelayedUpgrade: Upgrade | undefined;
}

// Extended interface for move transaction intents
interface MoveIntent extends TxIntent {
  methodName: 'move';
  from: LocationId;
  to: LocationId;
  forces: number;
  silver: number;
  artifact?: ArtifactId;
}

// Extended interface for upgrade transaction intents
interface UpgradeIntent extends TxIntent {
  methodName: 'upgradePlanet';
  locationId: LocationId;
  branch: number;
}

// Extended interface for transferPlanet transaction intents
interface TransferPlanetIntent extends TxIntent {
  methodName: 'transferPlanet';
  locationId: LocationId;
  newOwner: EthAddress;
}

// Extended interface for ready/notReady transaction intents
interface ReadyIntent extends TxIntent {
  methodName: 'ready' | 'notReady';
}

// Extended interface for disconnectTwitter transaction intents
interface DisconnectTwitterIntent extends TxIntent {
  methodName: 'disconnectTwitter';
}

/**
 * GameManager is the primary interface to the Dark Forest smart contract.
 * It handles all blockchain interactions and provides access to game state.
 */
export class GameManager extends EventEmitter {
  private readonly ethConnection: EthConnection;
  private readonly contractAddress: EthAddress;
  private readonly account: EthAddress;
  private contract!: Contract;
  private txCounter: number = 0;
  private planets: Map<LocationId, Planet> = new Map();
  private players: Map<EthAddress, Player> = new Map();
  private artifacts: Map<ArtifactId, Artifact> = new Map();
  private transactions: Map<TransactionId, Transaction> = new Map();
  private exploredChunks: Map<string, Chunk> = new Map();
  private revealedLocations: Map<LocationId, RevealedLocation> = new Map();
  private worldRadius: number = 0;
  private hashConfig: HashConfig;
  private wormholes: Map<LocationId, WormholeConfiguration> = new Map();
  private gameStarted: boolean = false;
  private gameOver: boolean = false;
  private winners: EthAddress[] = [];
  private startTime: number = 0;
  private endTime: number = 0;
  private blockedPlanets: Set<LocationId> = new Set();
  private targetPlanets: Map<LocationId, boolean> = new Map();
  private paused: boolean = false;
  private miningService: MiningService | undefined;
  private captureZoneGenerator: CaptureZoneGenerator | undefined;

  /**
   * Create a new GameManager for interacting with the Dark Forest contract
   */
  constructor(
    ethConnection: EthConnection,
    contractAddress: EthAddress,
    account: EthAddress,
    hashConfig: HashConfig
  ) {
    super();
    this.ethConnection = ethConnection;
    this.contractAddress = contractAddress;
    this.account = account;
    this.hashConfig = hashConfig;
    
    // Load the ABI before initializing the contract
    this.loadAbi();
    
    // Initialize the contract
    this.initializeContract();
  }

  /**
   * Initialize the GameManager by loading essential data
   */
  public async initialize(): Promise<void> {
    try {
      // Get world radius from contract
      const worldRadiusResult = await this.contract.worldRadius();
      this.worldRadius = Number(worldRadiusResult.toString());
      
      // Check if game is paused
      try {
        this.paused = await this.contract.paused();
      } catch (e) {
        console.log('Could not check if game is paused', e);
      }
      
      // Get game timing information
      await this.refreshGameState();
      
      // Load player data
      if (this.account) {
        await this.loadPlayer(this.account);
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize mining service
      this.initializeMiningService();
      
      // Initialize capture zone generator if enabled
      this.initializeCaptureZoneGenerator();
      
      console.log('GameManager initialized');
    } catch (e) {
      console.error('Error initializing GameManager:', e);
      throw e;
    }
  }
  
  /**
   * Setup listeners for contract events
   */
  private setupEventListeners(): void {
    try {
      // Planet update events
      this.contract.on('PlanetUpdated', (locationId: string) => {
        this.refreshPlanet(locationId as LocationId);
      });
      
      // Player events
      this.contract.on('PlayerInitialized', (player: string) => {
        this.refreshPlayer(player as EthAddress);
        this.emit(GameManagerEvent.PlayersUpdated);
      });
      
      // Artifact events
      this.contract.on('ArtifactFound', (artifactId: string) => {
        this.refreshArtifact(artifactId as ArtifactId);
      });
      
      // Game state events
      this.contract.on('GameStarted', () => {
        this.refreshGameState();
      });
      
      // Pause state changes
      this.contract.on('Paused', () => {
        this.paused = true;
      });
      
      this.contract.on('Unpaused', () => {
        this.paused = false;
      });
      
      this.contract.on('GameEnded', (winners: string[]) => {
        this.winners = winners as EthAddress[];
        this.gameOver = true;
      });
    } catch (e) {
      console.error('Error setting up event listeners:', e);
    }
  }
  
  /**
   * Refresh the overall game state
   */
  private async refreshGameState(): Promise<void> {
    try {
      // Get start time
      const startTime = await this.contract.gameStartBlock();
      this.startTime = Number(startTime.toString());
      
      // Get duration
      const duration = await this.contract.gameDuration();
      const durationSeconds = Number(duration.toString());
      
      // Calculate end time
      this.endTime = this.startTime + durationSeconds;
      
      // Check if game has started
      this.gameStarted = this.startTime > 0;
      
      // Check if game is over
      const currentTime = Math.floor(Date.now() / 1000);
      this.gameOver = this.gameStarted && currentTime > this.endTime;
    } catch (e) {
      console.error('Error refreshing game state:', e);
    }
  }

  /**
   * Get a planet by its location ID
   */
  public async getPlanet(locationId: LocationId): Promise<Planet | undefined> {
    // Check cache first
    if (this.planets.has(locationId)) {
      return this.planets.get(locationId);
    }
    
    try {
      // Get planet data from contract
      const planetData = await this.contract.planets(locationId);
      
      // Skip if planet doesn't exist
      if (!planetData || !planetData.isInitialized) {
        return undefined;
      }
      
      // Create planet using helper
      const planet = this.createPlanetFromContractData(planetData, locationId);
      
      // Get any active artifact
      try {
        const activeArtifactId = await this.getActiveArtifact(locationId);
        if (activeArtifactId) {
          const artifact = await this.getArtifact(activeArtifactId);
          if (artifact) {
            // Planet has an active artifact
            planet.heldArtifactIds = [activeArtifactId];
          }
        }
      } catch (e) {
        console.error(`Error getting active artifact for planet ${locationId}:`, e);
      }
      
      // Store in cache
      this.planets.set(locationId, planet);
      
      // Emit update
      this.emit(GameManagerEvent.PlanetUpdate, planet);
      
      return planet;
    } catch (e) {
      console.error(`Error getting planet ${locationId}:`, e);
      return undefined;
    }
  }
  
  /**
   * Refresh planet data from the contract
   */
  private async refreshPlanet(locationId: LocationId): Promise<void> {
    // Remove from cache to force refresh
    this.planets.delete(locationId);
    
    const planet = await this.getPlanet(locationId);
    if (planet) {
      this.emit(GameManagerEvent.PlanetUpdate, planet);
    }
  }
  
  /**
   * Get a player by address
   */
  public async getPlayer(address: EthAddress): Promise<Player | undefined> {
    // Check cache first
    if (this.players.has(address)) {
      return this.players.get(address);
    }
    
    try {
      // Get player data from contract
      const playerData = await this.contract.players(address);
      
      // Skip if player doesn't exist
      if (!playerData || !playerData.isInitialized) {
        return undefined;
      }
      
      // Create player object
      const player = {
        address,
        initTimestamp: Number(playerData.initTimestamp?.toString() || '0'),
        lastRevealTimestamp: Number(playerData.lastRevealTimestamp?.toString() || '0'),
        homePlanetId: playerData.homePlanet?.toString() as LocationId,
        score: Number(playerData.score?.toString() || '0'),
        spaceJunk: Number(playerData.spaceJunk?.toString() || '0'),
        spaceJunkLimit: Number(playerData.spaceJunkLimit?.toString() || '0'),
        twitter: playerData.twitter,
        twitterHandle: playerData.twitterHandle,
        lastClaimTimestamp: Number(playerData.lastClaimTimestamp?.toString() || '0'),
        claimedShips: Boolean(playerData.claimedShips),
        // Initialize arrays - these would be populated separately
        unconfirmedDepartures: [],
        unconfirmedUpgrades: [],
        unconfirmedBuyHats: [],
        unconfirmedPlanetTransfers: [],
      } as Player;
      
      // Store in cache
      this.players.set(address, player);
      
      // Emit update
      this.emit(GameManagerEvent.PlayerUpdate, player);
      
      return player;
    } catch (e) {
      console.error(`Error getting player ${address}:`, e);
      return undefined;
    }
  }
  
  /**
   * Refresh player data from the contract
   */
  private async refreshPlayer(address: EthAddress): Promise<void> {
    // Remove from cache to force refresh
    this.players.delete(address);
    
    const player = await this.getPlayer(address);
    if (player) {
      this.emit(GameManagerEvent.PlayerUpdate, player);
    }
  }
  
  /**
   * Load a player and their home planet
   */
  public async loadPlayer(address: EthAddress): Promise<Player | undefined> {
    const player = await this.getPlayer(address);
    if (!player) return undefined;
    
    // Load home planet if it exists
    if (player.homePlanetId) {
      await this.getPlanet(player.homePlanetId);
    }
    
    return player;
  }
  
  /**
   * Get an artifact by ID
   */
  public async getArtifact(artifactId: ArtifactId): Promise<Artifact | undefined> {
    // Check cache first
    if (this.artifacts.has(artifactId)) {
      return this.artifacts.get(artifactId);
    }
    
    try {
      // Get artifact data from contract
      const artifactData = await this.contract.artifacts(artifactId);
      
      // Skip if artifact doesn't exist
      if (!artifactData || !artifactData.isInitialized) {
        return undefined;
      }
      
      // Create artifact using helper
      const artifact = this.createArtifactFromContractData(artifactData, artifactId);
      
      // Store in cache
      this.artifacts.set(artifactId, artifact);
      
      // Emit update
      this.emit(GameManagerEvent.ArtifactUpdate, artifact);
      
      return artifact;
    } catch (e) {
      console.error(`Error getting artifact ${artifactId}:`, e);
      return undefined;
    }
  }
  
  /**
   * Refresh artifact data from the contract
   */
  private async refreshArtifact(artifactId: ArtifactId): Promise<void> {
    // Remove from cache to force refresh
    this.artifacts.delete(artifactId);
    
    const artifact = await this.getArtifact(artifactId);
    if (artifact) {
      this.emit(GameManagerEvent.ArtifactUpdate, artifact);
    }
  }
  
  /**
   * Get a planet's name
   */
  public getPlanetName(locationId: LocationId): string {
    // Get the planet first for type compatibility
    const planet = this.planets.get(locationId);
    return getPlanetName(planet || locationId);
  }
  
  /**
   * Get the world radius
   */
  public getWorldRadius(): number {
    return this.worldRadius;
  }
  
  /**
   * Check if a player is an admin
   */
  public async isAdmin(address: EthAddress = this.account): Promise<boolean> {
    try {
      const admin = await this.contract.admin();
      return address.toLowerCase() === admin.toLowerCase();
    } catch (e) {
      console.error(`Error checking if ${address} is admin:`, e);
      return false;
    }
  }
  
  /**
   * Get voyages (arrivals) for a planet
   */
  public async getArrivalsForPlanet(locationId: LocationId): Promise<QueuedArrival[]> {
    try {
      const arrivals = await this.contract.getPlanetArrivals(locationId);
      
      return arrivals.map((arrival: any) => ({
        eventId: arrival.eventId?.toString() as VoyageId,
        fromPlanet: arrival.fromPlanet as LocationId,
        toPlanet: arrival.toPlanet as LocationId,
        player: arrival.player as EthAddress,
        popArriving: Number(arrival.popArriving?.toString() || '0'),
        silverMoved: Number(arrival.silverMoved?.toString() || '0'),
        departureTime: Number(arrival.departureTime?.toString() || '0'),
        arrivalTime: Number(arrival.arrivalTime?.toString() || '0'),
        arrivalType: arrival.arrivalType
      }));
    } catch (e) {
      console.error(`Error getting arrivals for planet ${locationId}:`, e);
      return [];
    }
  }
  
  /**
   * Get player space junk
   */
  public async getPlayerSpaceJunk(address: EthAddress): Promise<number> {
    const player = await this.getPlayer(address);
    return player?.spaceJunk || 0;
  }
  
  /**
   * Get player space junk limit
   */
  public async getPlayerSpaceJunkLimit(address: EthAddress): Promise<number> {
    const player = await this.getPlayer(address);
    return player?.spaceJunkLimit || 0;
  }
  
  /**
   * Get default space junk for planet level
   */
  public getDefaultSpaceJunkForPlanetLevel(level: number): number {
    try {
      // This would be retrieved from contract constants in a real implementation
      const junkByLevel = [0, 15, 60, 150, 300, 500, 750, 1000, 1250, 1500];
      return junkByLevel[level] || 0;
    } catch (e) {
      console.error(`Error getting default space junk for level ${level}:`, e);
      return 0;
    }
  }
  
  /**
   * Get active artifact on a planet
   */
  public async getActiveArtifact(locationId: LocationId): Promise<ArtifactId | undefined> {
    try {
      const artifactId = await this.contract.getActiveArtifact(locationId);
      if (artifactId === EMPTY_ADDRESS) return undefined;
      return artifactId as ArtifactId;
    } catch (e) {
      console.error(`Error getting active artifact for planet ${locationId}:`, e);
      return undefined;
    }
  }
  
  /**
   * Get start time of the game
   */
  public async getStartTime(): Promise<number> {
    try {
      const startTime = await this.contract.gameStartBlock();
      return Number(startTime.toString());
    } catch (e) {
      console.error('Error getting game start time:', e);
      return 0;
    }
  }
  
  /**
   * Get game duration in seconds
   */
  public async getGameDuration(): Promise<number> {
    try {
      const duration = await this.contract.gameDuration();
      return Number(duration.toString());
    } catch (e) {
      console.error('Error getting game duration:', e);
      return 0;
    }
  }
  
  /**
   * Check if teams are enabled
   */
  public async getTeamsEnabled(): Promise<boolean> {
    try {
      return await this.contract.getTeamsEnabled();
    } catch (e) {
      console.error('Error checking if teams are enabled:', e);
      return false;
    }
  }
  
  /**
   * Get time until next broadcast is available
   */
  public async timeUntilNextBroadcastAvailable(locationId: LocationId): Promise<number> {
    try {
      const player = await this.getPlayer(this.account);
      if (!player) return Infinity;
      
      // Contract cooldown is in seconds
      const cooldown = await this.contract.LOCATION_REVEAL_COOLDOWN();
      
      if (!player.lastRevealTimestamp || !cooldown) {
        return 0;
      }
      
      const cooldownTime = player.lastRevealTimestamp + Number(cooldown.toString());
      const now = Math.floor(Date.now() / 1000);
      
      return Math.max(0, (cooldownTime - now) * 1000); // Return milliseconds
    } catch (e) {
      console.error(`Error getting broadcast time:`, e);
      return Infinity;
    }
  }
  
  /**
   * Get temperature at coordinates
   */
  public getTemperature(coords: WorldCoords): number {
    // Use perlin noise to determine temperature
    // perlin(coords, options) in @darkforest_eth/hashing
    const { x, y } = coords;
    return perlin({x, y}, {
      scale: 2,
      key: 3
    });
  }
  
  /**
   * Check if a planet is mineable
   */
  public isPlanetMineable(locationId: LocationId): boolean {
    const planet = this.planets.get(locationId);
    if (!planet) return false;
    
    // Check if planet is ruins
    return planet.planetType === PlanetType.RUINS;
  }
  
  /**
   * Check if a move is blocked
   */
  public isMoveBlocked(fromId: LocationId, toId: LocationId): boolean {
    try {
      // In a real implementation, check the contract for blocked planets
      return this.blockedPlanets.has(toId);
    } catch (e) {
      console.error(`Error checking if move is blocked from ${fromId} to ${toId}:`, e);
      return false;
    }
  }
  
  /**
   * Check if capture is blocked
   */
  public isCaptureBlocked(planetId: LocationId): boolean {
    try {
      // In a real implementation, check the contract for blocked planets
      return this.blockedPlanets.has(planetId);
    } catch (e) {
      console.error(`Error checking if capture is blocked for ${planetId}:`, e);
      return false;
    }
  }
  
  /**
   * Get player blocked planets
   */
  public getPlayerBlockedPlanets(address: EthAddress): LocationId[] {
    try {
      // In a real implementation, get this from the contract
      return Array.from(this.blockedPlanets);
    } catch (e) {
      console.error(`Error getting blocked planets for ${address}:`, e);
      return [];
    }
  }
  
  /**
   * Get player defense planets
   */
  public getPlayerDefensePlanets(address: EthAddress): LocationId[] {
    try {
      // In a real implementation, get this from the contract
      // For now, return empty array
      return [];
    } catch (e) {
      console.error(`Error getting defense planets for ${address}:`, e);
      return [];
    }
  }
  
  /**
   * Get wormholes as proper Wormhole objects
   */
  public getWormholes(): Wormhole[] {
    const wormholes: Wormhole[] = [];
    
    // Iterate through all artifacts looking for active wormholes
    for (const artifact of this.artifacts.values()) {
      if (artifact.artifactType === ArtifactType.Wormhole && 
          artifact.wormholeTo !== null && 
          isActivated(artifact)) {
        
        // Get the from and to planets
        const fromPlanet = this.planets.get(artifact.onPlanetId);
        const toPlanet = this.planets.get(artifact.wormholeTo);
        
        if (fromPlanet && toPlanet && fromPlanet.location && toPlanet.location) {
          // Create a proper Wormhole object
          wormholes.push({
            from: artifact.onPlanetId,
            to: artifact.wormholeTo,
            fromPlanet: fromPlanet.location,
            toPlanet: toPlanet.location,
            perlin: 0 // This is a placeholder, we might not need it
          });
        }
      }
    }
    
    return wormholes;
  }
  
  /**
   * Get wormhole factors for movement
   */
  public getWormholeFactors(fromId: LocationId, toId: LocationId): { distanceFactor: number, speedFactor: number } | undefined {
    try {
      // Check if there's a wormhole between these planets
      const fromPlanet = this.planets.get(fromId);
      const toPlanet = this.planets.get(toId);
      
      if (!fromPlanet || !toPlanet) return undefined;
      
      // Check for artifacts on these planets that might be wormholes
      const fromArtifacts = fromPlanet.heldArtifactIds.map(id => this.artifacts.get(id)).filter(a => a?.artifactType === ArtifactType.Wormhole);
      const toArtifacts = toPlanet.heldArtifactIds.map(id => this.artifacts.get(id)).filter(a => a?.artifactType === ArtifactType.Wormhole);
      
      // Check if there's a wormhole connection
      const fromToWormhole = fromArtifacts.find(a => a?.wormholeTo === toId);
      const toFromWormhole = toArtifacts.find(a => a?.wormholeTo === fromId);
      
      if (fromToWormhole || toFromWormhole) {
        // Different rarities give different bonuses
        const artifact = fromToWormhole || toFromWormhole;
        if (!artifact) return undefined;
        
        // Factor based on rarity (higher rarity = better bonus)
        const rarityFactor = artifact.rarity;
        return {
          distanceFactor: 1 + rarityFactor * 0.5, // Bonus increases with rarity
          speedFactor: 1 + rarityFactor * 0.5, // Bonus increases with rarity
        };
      }
      
      return undefined;
    } catch (e) {
      console.error(`Error getting wormhole factors between ${fromId} and ${toId}:`, e);
      return undefined;
    }
  }
  
  /**
   * Transfer planet ownership
   */
  public async transferOwnership(planetId: LocationId, newOwner: EthAddress): Promise<Transaction<UnconfirmedPlanetTransfer>> {
    const intent: TransferPlanetIntent = {
      methodName: 'transferPlanet',
      locationId: planetId,
      newOwner,
      contract: this.contract,
      args: Promise.resolve([planetId, newOwner])
    };
    
    return this.submitTransaction<TransferPlanetIntent>(intent);
  }
  
  /**
   * Get targets held by player
   */
  public getTargetsHeld(address: EthAddress): LocationId[] {
    try {
      const targets: LocationId[] = [];
      
      // In a real implementation, get this from the contract
      for (const [locationId, isTarget] of this.targetPlanets.entries()) {
        if (isTarget) {
          const planet = this.planets.get(locationId);
          if (planet && planet.owner === address) {
            targets.push(locationId);
          }
        }
      }
      
      return targets;
    } catch (e) {
      console.error(`Error getting targets held by ${address}:`, e);
      return [];
    }
  }
  
  /**
   * Set player ready state
   */
  public async setReady(ready: boolean): Promise<Transaction<UnconfirmedMove>> {
    const intent: ReadyIntent = {
      methodName: ready ? 'ready' : 'notReady',
      contract: this.contract,
      args: Promise.resolve([])
    };
    
    return this.submitTransaction<ReadyIntent>(intent);
  }
  
  /**
   * Disconnect player Twitter
   */
  public async disconnectTwitter(): Promise<Transaction<UnconfirmedMove>> {
    const intent: DisconnectTwitterIntent = {
      methodName: 'disconnectTwitter',
      contract: this.contract,
      args: Promise.resolve([])
    };
    
    return this.submitTransaction<DisconnectTwitterIntent>(intent);
  }
  
  /**
   * Create a new transaction
   */
  private createTransaction<T extends TxIntent>(intent: T): Transaction<T> {
    return {
      id: (this.txCounter++).toString() as TransactionId,
      intent,
      status: EthTxStatus.Queued,
      createdAt: Date.now()
    };
  }
  
  /**
   * Submit a transaction to the contract
   */
  public async submitTransaction<T extends TxIntent>(
    intent: T, 
    overrides?: providers.TransactionRequest
  ): Promise<Transaction<T>> {
    const tx = this.createTransaction(intent);
    
    try {
      // Update status
      tx.status = EthTxStatus.Submit;
      tx.submittedAt = Date.now();
      this.emit(GameManagerEvent.TransactionUpdate, tx);
      
      // Execute the contract method based on intent type
      let contractTx;
      
      switch (intent.methodName) {
        case 'move':
          const moveIntent = intent as unknown as MoveIntent;
          contractTx = await this.contract.move(
            moveIntent.from,
            moveIntent.to,
            moveIntent.forces,
            moveIntent.silver,
            overrides || {}
          );
          break;
          
        case 'upgradePlanet':
          const upgradeIntent = intent as unknown as UpgradeIntent;
          contractTx = await this.contract.upgradePlanet(
            upgradeIntent.locationId,
            upgradeIntent.branch,
            overrides || {}
          );
          break;
          
        case 'transferPlanet':
          const transferIntent = intent as unknown as TransferPlanetIntent;
          contractTx = await this.contract.transferPlanet(
            transferIntent.locationId,
            transferIntent.newOwner,
            overrides || {}
          );
          break;
          
        case 'ready':
          contractTx = await this.contract.ready(overrides || {});
          break;
          
        case 'notReady':
          contractTx = await this.contract.notReady(overrides || {});
          break;
          
        case 'disconnectTwitter':
          contractTx = await this.contract.disconnectTwitter(overrides || {});
          break;
          
        default:
          // For other transaction types, call the method dynamically
          if (intent.methodName && typeof this.contract[intent.methodName] === 'function') {
            const args = await intent.args;
            contractTx = await this.contract[intent.methodName](...args, overrides || {});
          } else {
            throw new Error(`Unknown method: ${intent.methodName}`);
          }
      }
      
      if (contractTx) {
        // Update with hash
        tx.hash = contractTx.hash;
        this.emit(GameManagerEvent.TransactionUpdate, tx);
        
        // Wait for confirmation
        const receipt = await contractTx.wait();
        tx.confirmedAt = Date.now();
        tx.status = receipt.status === 1 ? EthTxStatus.Complete : EthTxStatus.Fail;
        this.emit(GameManagerEvent.TransactionUpdate, tx);
        
        // Refresh relevant data based on transaction type
        if (tx.status === EthTxStatus.Complete) {
          if (intent.methodName === 'move') {
            const moveIntent = intent as unknown as MoveIntent;
            await this.refreshPlanet(moveIntent.from);
            await this.refreshPlanet(moveIntent.to);
          } else if (intent.methodName === 'upgradePlanet' || intent.methodName === 'transferPlanet') {
            const locationIntent = intent as unknown as { locationId?: LocationId };
            if (locationIntent.locationId) {
              await this.refreshPlanet(locationIntent.locationId);
            }
          } else if (intent.methodName === 'ready' || intent.methodName === 'notReady' || intent.methodName === 'disconnectTwitter') {
            await this.refreshPlayer(this.account);
          }
        }
      }
      
      return tx;
    } catch (e) {
      console.error('Error submitting transaction:', e);
      tx.status = EthTxStatus.Fail;
      this.emit(GameManagerEvent.TransactionUpdate, tx);
      throw e;
    }
  }
  
  /**
   * Get game paused state
   */
  public getPaused(): boolean {
    return this.paused;
  }
  
  /**
   * Get if the game is over
   */
  public isGameOver(): boolean {
    return this.gameOver;
  }
  
  /**
   * Get game winners
   */
  public getWinners(): EthAddress[] {
    return this.winners;
  }
  
  /**
   * Check if the game has started
   */
  public isGameStarted(): boolean {
    return this.gameStarted;
  }
  
  /**
   * Get time remaining in the game in seconds
   */
  public getTimeRemaining(): number {
    if (!this.startTime || !this.endTime) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, this.endTime - now);
  }
  
  /**
   * Check if the player can move to a planet (not blocked)
   */
  public playerMoveBlocked(account: EthAddress, targetLocation: LocationId): boolean {
    const player = this.players.get(account);
    if (!player) return false;
    return this.isMoveBlocked(targetLocation, player.homePlanetId);
  }
  
  /**
   * Check if the player can capture a planet (not blocked)
   */
  public playerCaptureBlocked(account: EthAddress, targetLocation: LocationId): boolean {
    const player = this.players.get(account);
    if (!player) return false;
    return this.isCaptureBlocked(targetLocation);
  }

  /**
   * Gets the maximuim distance that you can send your energy from the given planet,
   * using the given percentage of that planet's current silver.
   */
  public getMaxMoveDist(planetId: LocationId, sendingPercent: number, abandoning: boolean): number {
    const planet = this.planets.get(planetId);
    if (!planet) throw new Error('origin planet unknown');
    
    const range = planet.range;
    const buff = this.getRangeBuff(abandoning);
    
    return range * buff;
  }

  /**
   * Gets the distance between two planets. Takes into account wormholes.
   */
  public getDist(fromId: LocationId, toId: LocationId): number {
    const from = this.planets.get(fromId);
    const to = this.planets.get(toId);

    if (!from) throw new Error('origin planet unknown');
    if (!to) throw new Error('destination planet unknown');

    // Get the wormhole factors if any exist
    const wormholeFactors = this.getWormholeFactors(fromId, toId);

    // Calculate base distance
    let distance = this.getDistCoords(
      { x: from.location?.coords.x || 0, y: from.location?.coords.y || 0 },
      { x: to.location?.coords.x || 0, y: to.location?.coords.y || 0 }
    );

    // Apply wormhole distance factor if applicable
    if (wormholeFactors) {
      distance /= wormholeFactors.distanceFactor;
    }

    return distance;
  }

  /**
   * Gets the distance between two coordinates in space.
   */
  public getDistCoords(fromCoords: WorldCoords, toCoords: WorldCoords): number {
    return Math.sqrt(
      Math.pow(fromCoords.x - toCoords.x, 2) + 
      Math.pow(fromCoords.y - toCoords.y, 2)
    );
  }

  /**
   * Gets all the planets that you can reach with at least 1 energy from
   * the given planet. Does not take into account wormholes.
   */
  public getPlanetsInRange(planetId: LocationId, sendingPercent: number, abandoning: boolean): Planet[] {
    const planet = this.planets.get(planetId);
    if (!planet) throw new Error('planet unknown');
    if (!planet.location) throw new Error('planet location unknown');

    // Get the maximum range
    const range = this.getMaxMoveDist(planetId, sendingPercent, abandoning);
    const result: Planet[] = [];

    // Check all planets to see if they're in range
    for (const [id, p] of this.planets.entries()) {
      if (id === planetId || !p.location) continue;
      
      const dist = this.getDistCoords(
        planet.location.coords,
        p.location.coords
      );
      
      if (dist < range) {
        result.push(p);
      }
    }

    return result;
  }

  /**
   * Gets the amount of energy needed in order for a voyage from the given to the given
   * planet to arrive with your desired amount of energy.
   */
  public getEnergyNeededForMove(
    fromId: LocationId,
    toId: LocationId,
    arrivingEnergy: number,
    abandoning = false
  ): number {
    const from = this.planets.get(fromId);
    if (!from) throw new Error('origin planet unknown');
    
    const dist = this.getDist(fromId, toId);
    const range = from.range * this.getRangeBuff(abandoning);
    const rangeSteps = dist / range;

    // Energy decay formula based on distance
    const arrivingProp = arrivingEnergy / from.energyCap + 0.05;
    return arrivingProp * Math.pow(2, rangeSteps) * from.energyCap;
  }

  /**
   * Gets the amount of energy that would arrive if a voyage with the given parameters
   * was to occur. The toPlanet is optional, in case you want an estimate that doesn't include
   * wormhole speedups.
   */
  public getEnergyArrivingForMove(
    fromId: LocationId,
    toId: LocationId | undefined,
    distance: number | undefined,
    sentEnergy: number,
    abandoning: boolean
  ): number {
    const from = this.planets.get(fromId);
    const to = toId ? this.planets.get(toId) : undefined;

    if (!from) throw new Error('unknown planet');
    if (distance === undefined && toId === undefined)
      throw new Error('you must provide either a target planet or a distance');

    // Calculate distance
    const dist = (toId && this.getDist(fromId, toId)) || (distance as number);

    // Check for enemy wormhole
    if (to && toId) {
      const wormholeFactors = this.getWormholeFactors(fromId, toId);
      if (wormholeFactors !== undefined) {
        if (to.owner !== from.owner) {
          return 0; // Enemy wormholes destroy all energy
        }
      }
    }

    // Apply energy decay formula
    const range = from.range * this.getRangeBuff(abandoning);
    const scale = Math.pow(0.5, dist / range);
    let arrivingEnergy = scale * sentEnergy - 0.05 * from.energyCap;
    
    // Energy can't be negative
    if (arrivingEnergy < 0) arrivingEnergy = 0;

    return arrivingEnergy;
  }

  /**
   * Gets the amount of time, in seconds that a voyage between from the first to the
   * second planet would take.
   */
  public getTimeForMove(fromId: LocationId, toId: LocationId, abandoning = false): number {
    const from = this.planets.get(fromId);
    if (!from) throw new Error('origin planet unknown');
    
    const dist = this.getDist(fromId, toId);
    const speed = from.speed * this.getSpeedBuff(abandoning);
    
    // Convert speed to distance per second
    return dist / (speed / 100);
  }

  /**
   * Returns the speed buff multiplier when abandoning a planet
   */
  public getSpeedBuff(abandoning: boolean): number {
    // Check if there's a speed change when abandoning
    // In a real implementation, this would come from the contract constants
    if (abandoning) {
      return 1.5; // 50% speed boost when abandoning
    }
    return 1.0;
  }

  /**
   * Returns the range buff multiplier when abandoning a planet
   */
  public getRangeBuff(abandoning: boolean): number {
    // Check if there's a range change when abandoning
    // In a real implementation, this would come from the contract constants
    if (abandoning) {
      return 1.5; // 50% range boost when abandoning
    }
    return 1.0;
  }

  /**
   * Returns whether moves are globally blocked in the game
   */
  public blockMoves(): boolean {
    try {
      // In a real implementation, this would be fetched from contract constants
      return false;
    } catch (e) {
      console.error('Error checking if moves are blocked:', e);
      return false;
    }
  }

  /**
   * Returns whether captures are globally blocked in the game
   */
  public blockCapture(): boolean {
    try {
      // In a real implementation, this would be fetched from contract constants
      return false;
    } catch (e) {
      console.error('Error checking if captures are blocked:', e);
      return false;
    }
  }

  /**
   * Get the current elapsed game duration in seconds
   */
  public gameDuration(): number {
    if (!this.startTime) {
      return 0;
    }
    
    if (this.gameOver) {
      return this.endTime - this.startTime;
    }
    
    return Math.floor(Date.now() / 1000) - this.startTime;
  }

  /**
   * Gets all move transactions that have not been confirmed yet
   */
  public getUnconfirmedMoves(): Transaction<UnconfirmedMove>[] {
    const unconfirmedMoves: Transaction<UnconfirmedMove>[] = [];
    
    for (const tx of this.transactions.values()) {
      if (tx.intent.methodName === 'move' && tx.status !== EthTxStatus.Complete && tx.status !== EthTxStatus.Fail) {
        unconfirmedMoves.push(tx as Transaction<UnconfirmedMove>);
      }
    }
    
    return unconfirmedMoves;
  }

  /**
   * Gets all upgrade transactions that have not been confirmed yet
   */
  public getUnconfirmedUpgrades(): Transaction<UnconfirmedUpgrade>[] {
    const unconfirmedUpgrades: Transaction<UnconfirmedUpgrade>[] = [];
    
    for (const tx of this.transactions.values()) {
      if (tx.intent.methodName === 'upgradePlanet' && tx.status !== EthTxStatus.Complete && tx.status !== EthTxStatus.Fail) {
        unconfirmedUpgrades.push(tx as Transaction<UnconfirmedUpgrade>);
      }
    }
    
    return unconfirmedUpgrades;
  }

  /**
   * Gets all wormhole activation transactions that have not been confirmed yet
   */
  public getUnconfirmedWormholeActivations(): Transaction<UnconfirmedActivateArtifact>[] {
    const unconfirmedActivations: Transaction<UnconfirmedActivateArtifact>[] = [];
    
    for (const tx of this.transactions.values()) {
      if (tx.intent.methodName === 'activateArtifact' && 
          tx.status !== EthTxStatus.Complete && 
          tx.status !== EthTxStatus.Fail) {
        
        // Check if this is a wormhole activation (has wormholeTo property)
        const activateTx = tx as Transaction<UnconfirmedActivateArtifact>;
        if (activateTx.intent.wormholeTo) {
          unconfirmedActivations.push(activateTx);
        }
      }
    }
    
    return unconfirmedActivations;
  }

  /**
   * Gets a map of all planets owned by the current player
   */
  public getMyPlanetMap(): Map<LocationId, Planet> {
    const myPlanets = new Map<LocationId, Planet>();
    
    if (!this.account) return myPlanets;
    
    // Iterate through all planets and collect those owned by the player
    for (const [id, planet] of this.planets.entries()) {
      if (planet.owner === this.account) {
        myPlanets.set(id, planet);
      }
    }
    
    return myPlanets;
  }

  /**
   * Gets a list of all planets owned by the current player
   */
  public getMyPlanets(): Planet[] {
    return Array.from(this.getMyPlanetMap().values());
  }

  /**
   * Gets a list of all planets that have an owner
   */
  public getAllOwnedPlanets(): Planet[] {
    const ownedPlanets: Planet[] = [];
    
    for (const planet of this.planets.values()) {
      if (planet.owner !== EMPTY_ADDRESS) {
        ownedPlanets.push(planet);
      }
    }
    
    return ownedPlanets;
  }

  /**
   * Gets a list of planets that are targets (holdable objectives)
   */
  public getAllTargetPlanets(): Planet[] {
    const targetPlanets: Planet[] = [];
    
    for (const [id, isTarget] of this.targetPlanets.entries()) {
      if (isTarget) {
        const planet = this.planets.get(id);
        if (planet) {
          targetPlanets.push(planet);
        }
      }
    }
    
    return targetPlanets;
  }

  /**
   * Check if a planet is currently held as an objective
   */
  public isTargetHeld(planet: Planet): boolean {
    if (!this.account) return false;
    if (!this.targetPlanets.get(planet.locationId)) return false;
    
    // Check if planet is owned by current player
    if (planet.owner !== this.account) return false;
    
    // Check if planet has enough energy (typically 80% or more)
    const energyThreshold = 0.8; // 80%
    if ((planet.energy * 100) / planet.energyCap < energyThreshold * 100) return false;
    
    // Check if planet capture is not blocked for this player
    if (this.playerCaptureBlocked(this.account, planet.locationId)) return false;
    
    return true;
  }

  /**
   * Get the total number of targets required to win
   */
  public get targetsRequired(): number {
    // In a real implementation, this would come from contract constants
    return 3;
  }

  /**
   * Check if the current player has met the victory condition
   */
  public checkVictoryCondition(): boolean {
    if (!this.account) return false;
    
    const targetPlanets = this.getPlayerTargetPlanets(this.account);
    let capturedCount = 0;
    
    for (const planet of targetPlanets) {
      if (this.isTargetHeld(planet)) {
        capturedCount++;
        if (capturedCount >= this.targetsRequired) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get all players in the game
   */
  public getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }
  
  /**
   * Get player-specific target planets (those that aren't blocked)
   */
  public getPlayerTargetPlanets(account?: EthAddress): Planet[] {
    const player = this.getPlayer(account || this.account);
    if (!player) return [];
    
    const targetPlanets: Planet[] = [];
    
    for (const [id, isTarget] of this.targetPlanets.entries()) {
      if (isTarget) {
        if (player.homePlanetId && !this.isMoveBlocked(id, player.homePlanetId)) {
          const planet = this.planets.get(id);
          if (planet) {
            targetPlanets.push(planet);
          }
        }
      }
    }
    
    return targetPlanets;
  }

  /**
   * Create a properly typed planet object from contract data
   */
  private createPlanetFromContractData(planetData: any, locationId: LocationId): Planet {
    // Create planet object with proper typing
    const planet: ManagedPlanet = {
      locationId,
      perlin: Number(planetData.perlin?.toString() || '0'),
      owner: planetData.owner as EthAddress,
      planetLevel: Number(planetData.planetLevel?.toString() || '0') as PlanetLevel,
      planetType: Number(planetData.planetType?.toString() || '0') as PlanetType,
      isHomePlanet: Boolean(planetData.isHomePlanet),
      spaceType: Number(planetData.spaceType?.toString() || '0') as SpaceType,
      hasTriedFindingArtifact: false,
      
      // Resource-related fields
      energyCap: Number(planetData.populationCap?.toString() || '0'),
      energyGrowth: Number(planetData.populationGrowth?.toString() || '0'),
      silverCap: Number(planetData.silverCap?.toString() || '0'),
      silverGrowth: Number(planetData.silverGrowth?.toString() || '0'),
      energy: Number(planetData.population?.toString() || '0'),
      silver: Number(planetData.silver?.toString() || '0'),
      
      // Movement-related fields
      range: Number(planetData.range?.toString() || '0'),
      speed: Number(planetData.speed?.toString() || '0'),
      defense: Number(planetData.defense?.toString() || '0'),
      
      // Other fields
      spaceJunk: Number(planetData.spaceJunk?.toString() || '0'),
      lastUpdated: Number(planetData.lastUpdated?.toString() || '0'),
      upgradeState: [0, 0, 0],
      
      // Arrays for tracking pending operations
      unconfirmedDepartures: [],
      unconfirmedUpgrades: [],
      unconfirmedBuyHats: [],
      unconfirmedPlanetTransfers: [],
      heldArtifactIds: [],
      
      // Additional properties needed for full Planet compatibility
      hatLevel: 0,
      destroyed: false,
      unconfirmedAddEmoji: false,
      unconfirmedClearEmoji: false,
      silverSpent: 0,
      
      // Reveal state
      coordsRevealed: false,
      revealer: this.account
    };
    
    return planet as unknown as Planet;
  }
  
  /**
   * Create a properly typed artifact object from contract data
   */
  private createArtifactFromContractData(artifactData: any, artifactId: ArtifactId): Artifact {
    // Create artifact object with proper typing
    const artifact: ManagedArtifact = {
      id: artifactId,
      planetDiscoveredOn: artifactData.planetDiscoveredOn?.toString() as LocationId,
      rarity: Number(artifactData.rarity?.toString() || '0') as ArtifactRarity,
      planetBiome: Number(artifactData.planetBiome?.toString() || '0') as unknown as Biome,
      mintedAtTimestamp: Number(artifactData.mintedAtTimestamp?.toString() || '0'),
      discoverer: artifactData.discoverer as EthAddress,
      artifactType: Number(artifactData.artifactType?.toString() || '0') as ArtifactType,
      controller: artifactData.controller as EthAddress,
      currentOwner: artifactData.currentOwner as EthAddress,
      activations: Number(artifactData.activations?.toString() || '0'),
      lastActivated: Number(artifactData.lastActivated?.toString() || '0'),
      lastDeactivated: Number(artifactData.lastDeactivated?.toString() || '0'),
      wormholeTo: artifactData.wormholeTo?.toString() as LocationId | null,
      onPlanetId: artifactData.onPlanetId?.toString() as LocationId,
      isInititalized: true,
      upgrade: undefined,
      timeDelayedUpgrade: undefined
    };
    
    return artifact as unknown as Artifact;
  }

  /**
   * Initialize the mining service for this GameManager
   */
  private initializeMiningService(): void {
    this.miningService = new MiningService(this);
  }

  /**
   * Get the mining service for this GameManager
   */
  public getMiningService(): MiningService {
    if (!this.miningService) {
      this.miningService = new MiningService(this);
    }
    return this.miningService;
  }

  /**
   * Initialize the CaptureZoneGenerator if capture zones are enabled
   */
  private initializeCaptureZoneGenerator(): void {
    try {
      // We would check the contract constants to see if capture zones are enabled
      // For now, we'll just initialize it
      const gameStartBlock = this.startTime || Math.floor(Date.now() / 1000);
      const zoneChangeInterval = 100; // Default value, would come from contract
      
      this.captureZoneGenerator = new CaptureZoneGenerator(
        this,
        gameStartBlock,
        zoneChangeInterval
      );
      
      // Set up event listener for blockchain updates
      this.listenForNewBlock();
    } catch (e) {
      console.error('Error initializing CaptureZoneGenerator:', e);
    }
  }

  /**
   * Listen for new blockchain blocks to update capture zones
   */
  public listenForNewBlock(): void {
    // In a real implementation, we would subscribe to blockchain events
    // For now, we'll simulate this with a polling mechanism
    try {
      const blocksSubscription = this.ethConnection.blockNumber$;
      blocksSubscription.subscribe((blockNumber: number) => {
        if (this.captureZoneGenerator) {
          this.captureZoneGenerator.generate(blockNumber);
        }
      });
    } catch (e) {
      console.error('Error setting up block listener:', e);
      
      // Fallback: poll for blocks
      setInterval(async () => {
        try {
          const blockNumber = await this.ethConnection.getBlockNumber();
          if (this.captureZoneGenerator) {
            this.captureZoneGenerator.generate(blockNumber);
          }
        } catch (e) {
          console.error('Error in block polling:', e);
        }
      }, 15000); // Check every 15 seconds
    }
  }

  /**
   * Check if a planet is within a capture zone
   * @param locationId Planet ID to check
   * @returns True if planet is in a capture zone
   */
  public async isPlanetInCaptureZone(locationId: LocationId): Promise<boolean> {
    if (!this.captureZoneGenerator) {
      return false;
    }
    
    return await this.captureZoneGenerator.isInZone(locationId);
  }

  /**
   * Get all current capture zones
   * @returns Set of CaptureZone objects
   */
  public getCaptureZones(): Set<CaptureZone> {
    if (!this.captureZoneGenerator) {
      return new Set();
    }
    
    return this.captureZoneGenerator.getZones();
  }

  /**
   * Get the block number when capture zones will next change
   * @returns Block number of next zone change
   */
  public async getNextCaptureZoneChangeBlock(): Promise<number> {
    if (!this.captureZoneGenerator) {
      return 0;
    }
    
    const currentBlock = await this.ethConnection.getBlockNumber();
    return this.captureZoneGenerator.getNextChangeBlock(currentBlock);
  }

  /**
   * Access the CaptureZoneGenerator
   * @returns CaptureZoneGenerator instance or undefined if not enabled
   */
  public getCaptureZoneGenerator(): CaptureZoneGenerator | undefined {
    return this.captureZoneGenerator;
  }

  /**
   * Get the emitter for capture zone generation events
   * @returns Monomitter for CaptureZonesGeneratedEvent or undefined
   */
  public getCaptureZoneGeneratedEmitter(): Monomitter<CaptureZonesGeneratedEvent> | undefined {
    return this.captureZoneGenerator?.generated$;
  }

  /**
   * Load the ABI dynamically
   */
  private loadAbi(): void {
    try {
      // Try to locate the ABI file relative to the module
      const abiPath = path.resolve(__dirname, '../node_modules/@darkforest_eth/contracts/abis/DarkForest.json');
      
      // Check if file exists at that path
      if (fs.existsSync(abiPath)) {
        DarkForestABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        console.log('Loaded ABI from node_modules path');
      } else {
        // Try alternative path
        const altPath = path.resolve(process.cwd(), './node_modules/@darkforest_eth/contracts/abis/DarkForest.json');
        if (fs.existsSync(altPath)) {
          DarkForestABI = JSON.parse(fs.readFileSync(altPath, 'utf8'));
          console.log('Loaded ABI from alternative path');
        } else {
          // Try direct path from repo
          const directPath = path.resolve(process.cwd(), '../../contracts/abis/DarkForest.json');
          if (fs.existsSync(directPath)) {
            DarkForestABI = JSON.parse(fs.readFileSync(directPath, 'utf8'));
            console.log('Loaded ABI from direct repo path');
          } else {
            console.error('Could not find DarkForest.json ABI file');
            throw new Error('Missing DarkForest ABI file');
          }
        }
      }
    } catch (e) {
      console.error('Error loading ABI:', e);
      throw e;
    }
  }

  /**
   * Initialize the contract with the loaded ABI
   */
  public initializeContract(): void {
    if (!DarkForestABI) {
      throw new Error('ABI not loaded, cannot initialize contract');
    }
    
    // Initialize contract with ABI - access provider via the any type to avoid private property error
    this.contract = new Contract(
      this.contractAddress,
      DarkForestABI,
      (this.ethConnection as any).provider
    );
  }
} 