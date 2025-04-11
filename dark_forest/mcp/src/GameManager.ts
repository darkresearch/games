import { EthConnection } from "@darkforest_eth/network";
import { 
  EthAddress, 
  LocationId, 
  Planet, 
  Player, 
  Artifact,
  ArtifactId,
  WorldCoords,
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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Replace the static import with a declaration and dynamic import later
// import DarkForestABI from "@darkforest_eth/contracts/abis/DarkForest.json" with { type: 'json' };
// We'll use a dynamic approach to load the ABI
let DarkForestABI: any;
import { MiningService } from "./MiningService";
import { CaptureZoneGenerator, CaptureZonesGeneratedEvent } from "./CaptureZoneGenerator";
import { SnarkArgsHelper } from "./helpers/SnarkArgsHelper";

// Create ES Module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Define enum for transaction status
export enum TransactionStatus {
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
  status: TransactionStatus;
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
export interface HashConfig {
  planetHashKey: number;
  spaceTypeKey: number;
  biomeBaseKey: number;
  perlinLengthScale: number;
  perlinMirrorX: boolean;
  perlinMirrorY: boolean;
  planetRarity: number;
}

// Define our extended Planet type that includes location
interface PlanetWithLocation extends Planet {
  location?: WorldLocation;
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
  private snarkHelper: SnarkArgsHelper;

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
    
    // Initialize SNARK helper
    this.snarkHelper = new SnarkArgsHelper(hashConfig);
    
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
        moves: 0,
        ready: Boolean(playerData.ready || false),
        team: Number(playerData.team || 0),
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
   * Alias for getArtifact to match the method name used in toolHandlers
   */
  public getArtifactById(artifactId: ArtifactId): Promise<Artifact | undefined> {
    return this.getArtifact(artifactId);
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
      status: TransactionStatus.Queued,
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
      tx.status = TransactionStatus.Submit;
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
        tx.status = receipt.status === 1 ? TransactionStatus.Complete : TransactionStatus.Fail;
        this.emit(GameManagerEvent.TransactionUpdate, tx);
        
        // Refresh relevant data based on transaction type
        if (tx.status === TransactionStatus.Complete) {
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
      tx.status = TransactionStatus.Fail;
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
      if (tx.intent.methodName === 'move' && tx.status !== TransactionStatus.Complete && tx.status !== TransactionStatus.Fail) {
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
      if (tx.intent.methodName === 'upgradePlanet' && tx.status !== TransactionStatus.Complete && tx.status !== TransactionStatus.Fail) {
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
          tx.status !== TransactionStatus.Complete && 
          tx.status !== TransactionStatus.Fail) {
        
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
   * Creates a Planet object from contract data
   */
  private createPlanetFromContractData(planetData: any, locationId: LocationId): Planet {
    // Basic planet properties
    const planet: Planet = {
      locationId: locationId,
      perlin: Number(planetData.perlin || 0),
      owner: planetData.owner,
      planetLevel: Number(planetData.planetLevel || 0),
      planetType: Number(planetData.planetType || 0),
      isHomePlanet: Boolean(planetData.isHomePlanet),
      spaceType: Number(planetData.spaceType || 0),
      hasTriedFindingArtifact: Boolean(planetData.hasTriedFindingArtifact),
      
      // Resource-related properties
      energyCap: Number(planetData.populationCap || 0),
      energyGrowth: Number(planetData.populationGrowth || 0),
      silverCap: Number(planetData.silverCap || 0),
      silverGrowth: Number(planetData.silverGrowth || 0),
      energy: Number(planetData.population || 0),
      silver: Number(planetData.silver || 0),
      
      // Movement-related properties
      range: Number(planetData.range || 0),
      speed: Number(planetData.speed || 0),
      defense: Number(planetData.defense || 0),
      
      // Game mechanics properties
      spaceJunk: Number(planetData.spaceJunk || 0),
      lastUpdated: Number(planetData.lastUpdated || 0),
      upgradeState: [
        Number(planetData.upgradeState0 || 0),
        Number(planetData.upgradeState1 || 0),
        Number(planetData.upgradeState2 || 0)
      ],
      
      // Unconfirmed actions tracking
      unconfirmedDepartures: [],
      unconfirmedUpgrades: [],
      unconfirmedBuyHats: [],
      unconfirmedPlanetTransfers: [],
      
      // Artifacts
      heldArtifactIds: [],
      
      // Reveal status
      coordsRevealed: Boolean(planetData.coordsRevealed),
      revealer: planetData.revealer || EMPTY_ADDRESS,
      
      // Flags for UI and game mechanics
      isInContract: true,
      destroyed: Boolean(planetData.destroyed),
      needsServerRefresh: false,
      syncedWithContract: true,
      lastLoadedServerState: Date.now(),
      loadingServerState: false,
      transactions: undefined,
      messages: undefined,
      unconfirmedClearEmoji: false,
      unconfirmedAddEmoji: false,
      unconfirmedActivateArtifact: false,
      unconfirmedDeactivateArtifact: false,
      unconfirmedMove: false,
      unconfirmedRelease: undefined,
      invader: planetData.invader || EMPTY_ADDRESS,
      capturer: planetData.capturer || EMPTY_ADDRESS,
      invadeStartBlock: Number(planetData.invadeStartBlock || 0),
      blockedPlanetIds: [],
      hatLevel: Number(planetData.hatLevel || 0),
      prospectedBlockNumber: planetData.prospectedBlockNumber ? Number(planetData.prospectedBlockNumber) : undefined,
      isTargetPlanet: Boolean(planetData.isTargetPlanet),
      isSpawnPlanet: Boolean(planetData.isSpawnPlanet),
      emojiZoopAnimation: undefined,
      emojiZoopOutAnimation: undefined,
    };
    
    return planet;
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
    
    return await this.captureZoneGenerator.isPlanetInZone(locationId);
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
    
    return this.captureZoneGenerator.getNextChangeBlock();
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
      // Try to load from a local file
      // First, try to find the ABI in the parent directory's contracts folder
      const abiPath = path.join(__dirname, '../../contracts/abis/DarkForest.json');
      if (fs.existsSync(abiPath)) {
        console.log('Loading ABI from contracts directory:', abiPath);
        DarkForestABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      } 
      // Fallback to node_modules
      else {
        const nodeModulesPath = path.join(__dirname, '../node_modules/@darkforest_eth/contracts/abis/DarkForest.json');
        if (fs.existsSync(nodeModulesPath)) {
          console.log('Loading ABI from node_modules:', nodeModulesPath);
          DarkForestABI = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf8'));
      } else {
          // Fallback to a default minimal ABI if file doesn't exist
          console.warn('DarkForest ABI file not found, using minimal ABI');
          DarkForestABI = [
            // Example minimal ABI - should be replaced with actual functions needed
            "function planets(string) view returns (tuple)",
            "function players(address) view returns (tuple)",
            "function artifacts(string) view returns (tuple)",
            "function move(string, string, uint256, uint256, string) returns (tuple)",
            "function worldRadius() view returns (uint256)",
            "function initializePlayer(uint256, uint256, uint256, uint256) returns (tuple)",
            // Add other necessary functions
          ];
        }
      }
    } catch (e) {
      console.error('Error loading ABI:', e);
      throw e;
    }
  }

  /**
   * Initialize the contract
   */
  public initializeContract(): void {
    try {
      // Create contract instance
      const provider = this.ethConnection.getProvider();
      const signer = this.ethConnection.getSigner();
      
    this.contract = new Contract(
      this.contractAddress,
      DarkForestABI,
        signer || provider
      );
      
      console.log('Contract initialized with address:', this.contractAddress);
    } catch (e) {
      console.error('Error initializing contract:', e);
      throw e;
    }
  }

  /**
   * Initialize a new player in the game. First step when a player joins the game.
   */
  public async initializePlayer(x: string | number, y: string | number, r: string | number, f: string | number): Promise<any> {
    try {
      // Call the initializePlayer method on the contract
      const overrides: Overrides = { gasLimit: 5000000 };
      
      // Get snark arguments for initialization
      const snarkArgs = await this.snarkHelper.getInitArgs(
        Number(x),
        Number(y),
        Number(r)
      );
      
      // Combine SNARK args with faction parameter
      // In the Dark Forest contract, initializePlayer expects:
      // - _a, _b, _c: The ZK-SNARK proof data
      // - _input: Public inputs from the SNARK (uint256[8])
      // - team: Additional parameter for team selection
      // The order is [_a, _b, _c, _input, team]
      const fHex = typeof f === 'string' && f.startsWith('0x') ? f : `0x${Number(f).toString(16)}`;
      
      console.log(`Initializing player with SNARK proof and faction ${fHex}`);
      
      // Send the transaction with all the arguments
      const tx = await this.contract.initializePlayer(
        snarkArgs[0], // _a
        snarkArgs[1], // _b
        snarkArgs[2], // _c
        snarkArgs[3], // _input - the public signals
        fHex,         // team
        overrides
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log(`Player initialized. Transaction hash: ${receipt.transactionHash}`);
      
      // Refresh player data after initialization
      if (this.account) {
        await this.loadPlayer(this.account);
      }
      
      return {
        success: true,
        transaction: receipt
      };
    } catch (e) {
      console.error('Error initializing player:', e);
      throw e;
    }
  }

  /**
   * Prospect a planet for artifacts
   */
  public async prospectPlanet(planetId: LocationId): Promise<any> {
    try {
      const planet = await this.getPlanet(planetId);
      
      if (!planet) {
        throw new Error("Planet not found");
      }
      
      if (planet.owner !== this.account) {
        throw new Error("You don't own this planet");
      }
      
      if (planet.planetType !== PlanetType.RUINS) {
        throw new Error("This planet doesn't have an artifact");
      }
      
      if (planet.prospectedBlockNumber !== undefined) {
        throw new Error("This planet has already been prospected");
      }
      
      // Call the contract to prospect the planet
      const tx = await this.contract.prospectPlanet(planetId);
      const receipt = await tx.wait();
      
      // Update the planet after prospecting
      await this.refreshPlanet(planetId);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error prospecting planet:", e);
      throw e;
    }
  }
  
  /**
   * Find an artifact on a planet
   */
  public async findArtifact(planetId: LocationId): Promise<any> {
    try {
      const planet = await this.getPlanet(planetId);
      
      if (!planet) {
        throw new Error("Planet not found");
      }
      
      if (planet.owner !== this.account) {
        throw new Error("You don't own this planet");
      }
      
      if (planet.planetType !== PlanetType.RUINS) {
        throw new Error("This planet doesn't have an artifact");
      }
      
      if (planet.hasTriedFindingArtifact) {
        throw new Error("Someone already tried finding an artifact on this planet");
      }
      
      if (planet.prospectedBlockNumber === undefined) {
        throw new Error("You need to prospect this planet first");
      }
      
      // Call the contract to find the artifact
      const tx = await this.contract.findArtifact(planetId);
      const receipt = await tx.wait();
      
      // Update the planet and artifacts after finding
      await this.refreshPlanet(planetId);
      
      // Get the artifact that was found
      const artifactIds = planet.heldArtifactIds;
      if (artifactIds.length > 0) {
        const artifactId = artifactIds[0];
        await this.refreshArtifact(artifactId);
      }
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error finding artifact:", e);
      throw e;
    }
  }
  
  /**
   * Upgrade a planet
   */
  public async upgradePlanet(planetId: LocationId, branch: number): Promise<any> {
    try {
      const planet = await this.getPlanet(planetId);
      
      if (!planet) {
        throw new Error("Planet not found");
      }
      
      if (planet.owner !== this.account) {
        throw new Error("You don't own this planet");
      }
      
      // Call the contract to upgrade the planet
      const tx = await this.contract.upgradePlanet(planetId, branch);
      const receipt = await tx.wait();
      
      // Update the planet after upgrading
      await this.refreshPlanet(planetId);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error upgrading planet:", e);
      throw e;
    }
  }
  
  /**
   * Buy a hat for a planet
   */
  public async buyHat(planetId: LocationId): Promise<any> {
    try {
      const planet = await this.getPlanet(planetId);
      
      if (!planet) {
        throw new Error("Planet not found");
      }
      
      if (planet.owner !== this.account) {
        throw new Error("You don't own this planet");
      }
      
      // Calculate hat cost based on current hat level
      const hatLevel = planet.hatLevel || 0;
      const hatCost = BigNumber.from(10).pow(18).mul(BigNumber.from(2).pow(hatLevel));
      
      // Call the contract to buy a hat
      const tx = await this.contract.buyHat(planetId, { value: hatCost });
      const receipt = await tx.wait();
      
      // Update the planet after buying a hat
      await this.refreshPlanet(planetId);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error buying hat:", e);
      throw e;
    }
  }
  
  /**
   * Reveal a planet's location
   */
  public async revealLocation(planetId: LocationId, x: number, y: number, r: number): Promise<any> {
    try {
      // Call the contract to reveal the location
      const tx = await this.contract.revealLocation(planetId, x, y, r);
      const receipt = await tx.wait();
      
      // Update the planet after revealing
      await this.refreshPlanet(planetId);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error revealing location:", e);
      throw e;
    }
  }
  
  /**
   * Deposit an artifact on a planet
   */
  public async depositArtifact(locationId: LocationId, artifactId: ArtifactId): Promise<any> {
    try {
      // Call the contract to deposit the artifact
      const tx = await this.contract.depositArtifact(locationId, artifactId);
      const receipt = await tx.wait();
      
      // Update the planet and artifact
      await Promise.all([
        this.refreshPlanet(locationId),
        this.refreshArtifact(artifactId)
      ]);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error depositing artifact:", e);
      throw e;
    }
  }
  
  /**
   * Withdraw an artifact from a planet
   */
  public async withdrawArtifact(locationId: LocationId, artifactId: ArtifactId): Promise<any> {
    try {
      // Call the contract to withdraw the artifact
      const tx = await this.contract.withdrawArtifact(locationId, artifactId);
      const receipt = await tx.wait();
      
      // Update the planet and artifact
      await Promise.all([
        this.refreshPlanet(locationId),
        this.refreshArtifact(artifactId)
      ]);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error withdrawing artifact:", e);
      throw e;
    }
  }
  
  /**
   * Activate an artifact
   */
  public async activateArtifact(
    locationId: LocationId,
    artifactId: ArtifactId,
    wormholeTo?: LocationId
  ): Promise<any> {
    try {
      // Call the contract to activate the artifact
      const tx = await this.contract.activateArtifact(
        locationId,
        artifactId,
        wormholeTo || "0x0"
      );
      const receipt = await tx.wait();
      
      // Update the planet and artifact
      await Promise.all([
        this.refreshPlanet(locationId),
        this.refreshArtifact(artifactId)
      ]);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error activating artifact:", e);
      throw e;
    }
  }
  
  /**
   * Deactivate an artifact
   */
  public async deactivateArtifact(locationId: LocationId): Promise<any> {
    try {
      // Call the contract to deactivate the artifact
      const tx = await this.contract.deactivateArtifact(locationId);
      const receipt = await tx.wait();
      
      // Update the planet
      await this.refreshPlanet(locationId);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error deactivating artifact:", e);
      throw e;
    }
  }
  
  /**
   * Withdraw silver from a planet
   */
  public async withdrawSilver(locationId: LocationId, amount: number): Promise<any> {
    try {
      // Call the contract to withdraw silver
      const tx = await this.contract.withdrawSilver(locationId, amount);
      const receipt = await tx.wait();
      
      // Update the planet
      await this.refreshPlanet(locationId);
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error withdrawing silver:", e);
      throw e;
    }
  }
  
  /**
   * Claim victory
   */
  public async claimVictory(): Promise<any> {
    try {
      // Call the contract to claim victory
      const tx = await this.contract.claimVictory();
      const receipt = await tx.wait();
      
      return {
        txHash: receipt.transactionHash,
        success: true
      };
    } catch (e) {
      console.error("Error claiming victory:", e);
      throw e;
    }
  }
  
  /**
   * Start exploring/mining
   */
  public startExplore(): void {
    this.getMiningService().startExplore();
  }
  
  /**
   * Stop exploring/mining
   */
  public stopExplore(): void {
    this.getMiningService().stopExplore();
  }
  
  /**
   * Set the number of cores for mining
   */
  public setMinerCores(cores: number): void {
    this.getMiningService().setCores(cores);
  }
  
  /**
   * Check if mining is active
   */
  public isMining(): boolean {
    return this.getMiningService().isMining();
  }
  
  /**
   * Get the currently exploring chunk
   */
  public getCurrentlyExploringChunk(): Rectangle | undefined {
    return this.getMiningService().getCurrentChunk();
  }
  
  /**
   * Get all explored chunks
   */
  public getExploredChunks(): Set<Chunk> {
    return this.getMiningService().getExploredChunks();
  }
  
  /**
   * Check if a chunk has been mined
   */
  public hasMinedChunk(chunk: Rectangle): boolean {
    return this.getMiningService().hasMinedChunk(chunk);
  }

  /**
   * Get the Twitter handle associated with an address
   */
  public async getTwitter(address: EthAddress): Promise<string | undefined> {
    const player = await this.getPlayer(address);
    return player?.twitter;
  }

  /**
   * Get the hash configuration
   */
  public getHashConfig(): HashConfig {
    return { ...this.hashConfig };
  }

  /**
   * Get the end time in seconds
   */
  public getEndTimeSeconds(): number | undefined {
    return this.endTime;
  }

  /**
   * Get the token mint end time in seconds
   */
  public getTokenMintEndTimeSeconds(): number {
    // This would typically come from the contract
    // For now, we're just returning the end time
    return this.endTime;
  }

  /**
   * Get a player's energy
   */
  public async getEnergyOfPlayer(address: EthAddress): Promise<number> {
    let totalEnergy = 0;
    
    // Get the player's planets
    for (const planet of this.planets.values()) {
      if (planet.owner === address) {
        totalEnergy += planet.energy;
      }
    }
    
    return totalEnergy;
  }
  
  /**
   * Get a player's silver
   */
  public async getSilverOfPlayer(address: EthAddress): Promise<number> {
    let totalSilver = 0;
    
    // Get the player's planets
    for (const planet of this.planets.values()) {
      if (planet.owner === address) {
        totalSilver += planet.silver;
      }
    }
    
    return totalSilver;
  }

  /**
   * Get the EthConnection object
   */
  public getEthConnection(): EthConnection {
    return this.ethConnection;
  }

  /**
   * Submits a transaction to move forces from one planet to another.
   * Adapted for server-side use, simplified compared to the client version.
   */
  public async move(
    fromId: LocationId,
    toId: LocationId,
    forces: number,
    silver: number = 0,
    artifactId?: ArtifactId
  ): Promise<any> {
    try {
      if (this.gameOver) {
        throw new Error('Game has ended');
      }

      if (this.paused) {
        throw new Error('Game is paused');
      }

      const fromPlanet = await this.getPlanet(fromId);
      const toPlanet = await this.getPlanet(toId);

      if (!fromPlanet || !toPlanet) {
        throw new Error('Origin or destination planet not found');
      }

      if (fromPlanet.owner !== this.account) {
        throw new Error('You do not own the origin planet');
      }

      if (forces > fromPlanet.energy) {
        throw new Error('Not enough forces on the origin planet');
      }

      if (silver > fromPlanet.silver) {
        throw new Error('Not enough silver on the origin planet');
      }

      // Execute the move on the contract
      const tx = await this.contract.move(fromId, toId, forces, silver, artifactId || '0x0');
      const receipt = await tx.wait();

      // Update the planets after the move
      await this.refreshPlanet(fromId);
      await this.refreshPlanet(toId);

      return {
        txHash: receipt.transactionHash,
        from: fromId,
        to: toId,
        forces,
        silver,
        artifact: artifactId
      };
    } catch (error) {
      console.error('Error executing move:', error);
      throw error;
    }
  }
  
  /**
   * Get planets within range of a given location in the world
   */
  public getPlanetsInWorldRectangle(
    worldX: number,
    worldY: number,
    worldWidth: number,
    worldHeight: number,
    levels: number[]
  ): Planet[] {
    // Get all planets that are in the given rectangle
    const result: Planet[] = [];
    
    for (const planet of this.planets.values()) {
      // Skip planets that don't meet level criteria if levels is provided
      if (levels.length > 0 && !levels.includes(planet.planetLevel)) {
        continue;
      }
      
      // Check if planet's coordinates are in the rectangle
      const planetWithLocation = planet as PlanetWithLocation;
      if (planetWithLocation.location && planetWithLocation.location.coords) {
        const { x, y } = planetWithLocation.location.coords;
        if (
          x >= worldX && 
          x <= worldX + worldWidth && 
          y >= worldY && 
          y <= worldY + worldHeight
        ) {
          result.push(planet);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get all voyages (movements) that are in progress
   */
  public getAllVoyages(): QueuedArrival[] {
    return this.contract.getAllArrivals ? 
      this.contract.getAllArrivals() : 
      [];
  }
} 