import { EthConnection } from "@darkforest_eth/network";
import { EthAddress, LocationId, WorldCoords } from "@darkforest_eth/types";
import { providers } from "ethers";
import { GameManager } from "./GameManager";
import { WalletManager } from "../helpers/WalletManager";
import { twoPlayerHashConfig } from "../config";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Interface for tracking planet discoveries and explored chunks for each agent
 */
export interface AgentMiningState {
  discoveredChunks: Set<string>; // Serialized chunk footprints
  discoveredPlanets: Set<LocationId>;
}

/**
 * Manages GameManager instances for each player
 */
export class PlayerRegistry {
  private players: Map<EthAddress, GameManager> = new Map();
  private ethConnection: EthConnection;
  private gamePubkey: EthAddress;
  private baseContractAddress: EthAddress;
  private walletManager: WalletManager;
  private networkId: number;
  private agentMiningState: Map<EthAddress, AgentMiningState> = new Map();

  constructor(gamePubkey: EthAddress, baseContractAddress: EthAddress, networkId: number) {
    this.gamePubkey = gamePubkey;
    this.baseContractAddress = baseContractAddress;
    this.walletManager = new WalletManager();
    this.networkId = networkId;
    
    // Get JSON RPC URL from environment variable
    const jsonRpcUrl = process.env.DARK_FOREST_JSON_RPC_URL;
    let provider: providers.JsonRpcProvider;
    
    if (jsonRpcUrl) {
      // Use provided RPC URL
      provider = new providers.JsonRpcProvider(jsonRpcUrl);
      console.log(`Connecting to Ethereum network using RPC URL: ${jsonRpcUrl}`);
    } else {
      // No RPC URL provided, use a mock provider for development
      console.warn('WARNING: No DARK_FOREST_JSON_RPC_URL environment variable set.');
      console.warn('Using a mock provider for development. Some blockchain features will not work.');
      console.warn('For production use, please set DARK_FOREST_JSON_RPC_URL to a valid Ethereum RPC endpoint.');
      
      // Create a minimal mock provider for development that doesn't try to connect
      provider = new providers.JsonRpcProvider();
      
      // Disable actual network calls to prevent errors
      // @ts-ignore - accessing private property for mock configuration
      provider._websocket = null;
      // @ts-ignore - accessing private property for mock configuration
      provider._events = [];
    }
    
    // Use provided network ID
    this.ethConnection = new EthConnection(provider, networkId);

    // Load and initialize players
    this.loadPlayers();
  }

  /**
   * Load players from storage and initialize them
   */
  private async loadPlayers(): Promise<void> {
    const playersPath = path.join(__dirname, '../data/players.json');
    
    try {
      if (fs.existsSync(playersPath)) {
        const data = fs.readFileSync(playersPath, 'utf8');
        const playerAddresses = JSON.parse(data) as EthAddress[];
        
        console.log(`Found ${playerAddresses.length} players to initialize`);
        
        // Initialize each player
        for (const address of playerAddresses) {
          try {
            await this.getOrCreatePlayer(address);
            console.log(`Initialized player ${address}`);
          } catch (e) {
            console.error(`Failed to initialize player ${address}:`, e);
          }
        }
        
        console.log(`Finished initializing ${this.players.size} players`);
      } else {
        console.log('No player data found, starting with empty player list');
      }
    } catch (e) {
      console.error('Error loading players:', e);
      // Continue with empty player list
    }
  }

  /**
   * Generate a new Ethereum address for an agent
   */
  public generatePubkey(): EthAddress {
    return this.walletManager.generateWallet();
  }

  /**
   * Check if the address has a wallet associated with it
   */
  public hasWallet(address: EthAddress): boolean {
    return this.walletManager.hasWallet(address);
  }

  /**
   * Gets or creates the mining state for an agent
   */
  public getAgentMiningState(agentId: EthAddress): AgentMiningState {
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
   * Add a discovered planet to the agent's mining state
   */
  public addDiscoveredPlanet(agentId: EthAddress, planetId: LocationId): void {
    const state = this.getAgentMiningState(agentId);
    state.discoveredPlanets.add(planetId);
  }

  /**
   * Add a discovered chunk to the agent's mining state
   */
  public addDiscoveredChunk(agentId: EthAddress, chunkKey: string): void {
    const state = this.getAgentMiningState(agentId);
    state.discoveredChunks.add(chunkKey);
  }

  /**
   * Check if an agent has already discovered a chunk
   */
  public hasDiscoveredChunk(agentId: EthAddress, chunkKey: string): boolean {
    const state = this.getAgentMiningState(agentId);
    return state.discoveredChunks.has(chunkKey);
  }

  /**
   * Get all planets discovered by an agent
   */
  public getDiscoveredPlanets(agentId: EthAddress): LocationId[] {
    const state = this.getAgentMiningState(agentId);
    return Array.from(state.discoveredPlanets);
  }

  async getOrCreatePlayer(address: EthAddress): Promise<GameManager> {
    // First, check if we have a wallet for this address
    if (!this.walletManager.hasWallet(address)) {
      throw new Error(`No wallet found for address ${address}. Please use the generatePubkey tool first.`);
    }

    let player = this.players.get(address);
    if (!player) {
      // Get the agent's wallet
      const wallet = this.walletManager.getWallet(address);
      
      // Connect the wallet to our provider
      const provider = this.ethConnection.getProvider() as providers.JsonRpcProvider;
      const connectedWallet = wallet!.connect(provider);
      
      // Create an EthConnection with a signer for this player
      const playerEthConnection = new EthConnection(provider, this.networkId);
      
      // Set the signer for this connection
      // @ts-ignore - Accessing private property to set the signer directly
      playerEthConnection.signer = connectedWallet;
      
      // Create new GameManager instance with the game-specific pubkey
      player = new GameManager(
        playerEthConnection,
        this.gamePubkey,
        address,
        {
          // Use the twoPlayerHashConfig from config.ts
          planetHashKey: twoPlayerHashConfig.PLANETHASH_KEY,
          spaceTypeKey: twoPlayerHashConfig.SPACETYPE_KEY,
          biomeBaseKey: twoPlayerHashConfig.BIOMEBASE_KEY,
          perlinLengthScale: twoPlayerHashConfig.PERLIN_LENGTH_SCALE,
          perlinMirrorX: twoPlayerHashConfig.PERLIN_MIRROR_X,
          perlinMirrorY: twoPlayerHashConfig.PERLIN_MIRROR_Y,
          planetRarity: twoPlayerHashConfig.PLANET_RARITY,
          planetLevelThresholds: twoPlayerHashConfig.PLANET_LEVEL_THRESHOLDS,
          worldRadius: twoPlayerHashConfig.WORLD_RADIUS_MIN
        },
        this
      );

      this.players.set(address, player);
    }
    return player;
  }

  getPlayer(address: EthAddress): GameManager | undefined {
    return this.players.get(address);
  }

  removePlayer(address: EthAddress): void {
    const player = this.players.get(address);
    if (player) {
      // Clean up resources - we don't have destroy() method in the code sample
      // so we're just removing it from the map
      this.players.delete(address);
    }
  }

  /**
   * Get all registered player addresses
   */
  public getAllPlayerAddresses(): EthAddress[] {
    return Array.from(this.players.keys());
  }
} 