import { EthConnection } from "@darkforest_eth/network";
import { 
  EthAddress, 
  LocationId, 
  ArtifactId,
  TxIntent,
  TransactionId,
  WorldLocation,
  WorldCoords,
} from "@darkforest_eth/types";
import { providers, Contract, } from "ethers";
import { EventEmitter } from "events";
import { CONTRACT_PRECISION } from "@darkforest_eth/constants";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
let DarkForestABI: any;
import { SnarkArgsHelper } from "../helpers/SnarkArgsHelper";
import * as logger from '../helpers/logger';
import { MiningService } from "./MiningService";
import { PlayerRegistry } from "./PlayerRegistry";
import { locationIdToDecStr, decodePlanet } from "@darkforest_eth/serde";

// Create ES Module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const enum ZKArgIdx {
  PROOF_A,
  PROOF_B,
  PROOF_C,
  DATA,
}

export type MoveArgs = [
  [string, string], // proofA
  [
    // proofB
    [string, string],
    [string, string]
  ],
  [string, string], // proofC
  [
    string, // from locationID (BigInt)
    string, // to locationID (BigInt)
    string, // perlin at to
    string, // radius at to
    string, // distMax
    string, // planetHashKey
    string, // spaceTypeKey
    string, // perlin lengthscale
    string, // perlin xmirror (1 true, 0 false)
    string, // perlin ymirror (1 true, 0 false)
    string, // ships sent
    string, // silver sent
    string, // artifactId sent
    string // is planet being released (1 true, 0 false)
  ]
];


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

// Interface for hash configuration
export interface HashConfig {
  planetHashKey: number;
  spaceTypeKey: number;
  biomeBaseKey: number;
  perlinLengthScale: number;
  perlinMirrorX: boolean;
  perlinMirrorY: boolean;
  planetRarity: number;
  planetLevelThresholds: number[];
  worldRadius: number;
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
  private worldRadius: number = 0;
  private hashConfig: HashConfig;
  private snarkHelper: SnarkArgsHelper;
  private miningService: MiningService | null = null;
  private playerRegistry: PlayerRegistry;

  /**
   * Create a new GameManager for interacting with the Dark Forest contract
   */
  constructor(
    ethConnection: EthConnection,
    contractAddress: EthAddress,
    account: EthAddress,
    hashConfig: HashConfig,
    playerRegistry: PlayerRegistry
  ) {
    super();
    this.ethConnection = ethConnection;
    this.contractAddress = contractAddress;
    this.account = account;
    this.hashConfig = hashConfig;
    this.worldRadius = hashConfig.worldRadius;
    this.playerRegistry = playerRegistry;
    
    // Initialize SNARK helper
    this.snarkHelper = new SnarkArgsHelper(hashConfig);

    // Initialize mining service
    this.miningService = new MiningService(this, this.playerRegistry);
    
    // Load the ABI before initializing the contract
    this.loadAbi();

    // Initialize
    this.initializeContract();
  }
  
  /**
   * Get the world radius
   */
  public getWorldRadius(): number {
    return this.worldRadius;
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
   * Get the hash configuration
   */
  public getHashConfig(): HashConfig {
    return { ...this.hashConfig };
  }

  /**
   * Get the EthConnection object
   */
  public getEthConnection(): EthConnection {
    return this.ethConnection;
  }

  /**
   * Get the MiningService, initializing if necessary
   */
  public getMiningService(): MiningService {
    return this.miningService as MiningService;
  }

  /** TX SENDING =========================================================================== */
  
  /**
   * Create a new transaction
   */
  private createTransaction<T extends TxIntent>(intent: T): Transaction<T> {
    const txId = this.txCounter++;
    return {
      intent,
      createdAt: Date.now(),
      status: TransactionStatus.Queued,
      id: txId.toString() as unknown as TransactionId,
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
      
      // Add high gas limit to overrides to prevent estimation failures
      const txOverrides = {
        ...overrides,
        gasLimit: overrides?.gasLimit || 2000000 // Default to 2 million gas if not specified
      };
      
      // Execute the contract method directly
      if (intent.methodName && typeof this.contract[intent.methodName] === 'function') {
        const args = await intent.args;
        const contractTx = await this.contract[intent.methodName](...args, txOverrides);
        
        // Update with hash
        tx.hash = contractTx.hash;
        this.emit(GameManagerEvent.TransactionUpdate, tx);
        
        // Wait for confirmation
        const receipt = await contractTx.wait();
        tx.confirmedAt = Date.now();
        tx.status = receipt.status === 1 ? TransactionStatus.Complete : TransactionStatus.Fail;
        this.emit(GameManagerEvent.TransactionUpdate, tx);

      } else {
        throw new Error(`Unknown method: ${intent.methodName}`);
      }
      
      return tx;
    } catch (e) {
      console.error('Error submitting transaction:', e);
      tx.status = TransactionStatus.Fail;
      this.emit(GameManagerEvent.TransactionUpdate, tx);
      throw e;
    }
  }

  /** TX SENDING ====================================================================== */

  /** TOOLS =========================================================================== */

  /**
   * Initialize a new player in the game. First step when a player joins the game.
   */
  // NOTE: Right now we do NOT support teams.
  public async initializePlayer(
    worldLocation: WorldLocation
  ): Promise<Transaction> {

    const getArgs = async () => {
      const args = await this.snarkHelper.getInitArgs(
        worldLocation.coords.x,
        worldLocation.coords.y,
        Math.floor(Math.sqrt(worldLocation.coords.x ** 2 + worldLocation.coords.y ** 2)) + 1 // floor(sqrt(x^2 + y^2)) + 1
      );
      return [...args, 0]; // NOTE: We don't support teams yet
    };

    const txIntent = {
      methodName: 'initializePlayer',
      contract: this.contract.contract,
      locationId: worldLocation.hash,
      location: worldLocation,
      args: getArgs(),
    };

    // Log the transaction intent details
    logger.debug(`Transaction Intent:, ${{
      methodName: txIntent.methodName,
      locationId: txIntent.locationId,
      coordinates: {
        x: txIntent.location.coords.x,
        y: txIntent.location.coords.y
      },
      hash: txIntent.location.hash,
      perlin: txIntent.location.perlin,
      biomebase: txIntent.location.biomebase
    }}`);

    while (true) {
      try {
        const tx = await this.submitTransaction(txIntent);
        return tx;
      } catch (e) {
        throw e;
      }
    }
  }

  /**
   * Submits a transaction to move forces from one planet to another.
   * Adapted for server-side use, simplified compared to the client version.
   */
  public async move(
    fromId: LocationId,
    toId: LocationId,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    forces: number,
    silver: number = 0,
    artifactId?: ArtifactId
  ): Promise<any> {
    try {
      logger.debug(`Move called with:
        fromId: ${fromId}
        toId: ${toId}
        fromX: ${fromX}
        fromY: ${fromY}
        toX: ${toX}
        toY: ${toY}
        forces: ${forces}
        silver: ${silver}
      `);

      // Calculate max distance based on actual distance between points
      const xDiff = toX - fromX;
      const yDiff = toY - fromY;
      const distMax = Math.ceil(Math.sqrt(xDiff ** 2 + yDiff ** 2));
      logger.debug(`Calculated distMax: ${distMax}`);

      // Generate ZK move args
      const getArgs = async () => {
        logger.debug('Generating SNARK args...');
        const snarkArgs = await this.snarkHelper.getMoveArgs(
          fromX,
          fromY,
          toX,
          toY,
          this.worldRadius,
          distMax
        );

        // const CONTRACT_PRECISION = 1000;
        const args: MoveArgs = [
          snarkArgs[ZKArgIdx.PROOF_A],
          snarkArgs[ZKArgIdx.PROOF_B],
          snarkArgs[ZKArgIdx.PROOF_C],
          [
            ...snarkArgs[ZKArgIdx.DATA],
            (forces * CONTRACT_PRECISION).toString(),
            (silver * CONTRACT_PRECISION).toString(),
            '0', // Default artifact value
            '0', // Not abandoning
          ],
        ] as MoveArgs;

        logger.debug('Move args prepared');

        return args;
      };

      logger.debug(`getArgs(): ${JSON.stringify(await getArgs())}`);

      const txIntent = {
        methodName: 'move',
        contract: this.contract.contract,
        args: getArgs(),
        from: fromId,
        to: toId,
        forces,
        silver,
        artifact: artifactId,
        abandoning: false
      };

      const tx = await this.submitTransaction(txIntent);
      return tx;
    } catch (error) {
      console.error('Error executing move:', error);
      throw error;
    }
  }

  /** PLANET METHODS ================================================================== */

  /**
   * Gets a planet entity by its ID.
   * @param locationId The ID of the planet to get
   * @returns The planet entity, or undefined if the planet doesn't exist
   */
  public async getPlanetWithId(locationId: LocationId): Promise<any> {
    try {
      // Convert locationId to decimal string for contract call
      const decStrId = locationIdToDecStr(locationId);
      
      // Make contract calls to get planet data
      const rawPlanet = await this.contract.planets(decStrId);
      
      // Check if planet exists
      if (!rawPlanet || !rawPlanet[0]) {
        return undefined;
      }
      
      // Get extended info
      const rawExtendedInfo = await this.contract.planetsExtendedInfo(decStrId);
      const rawExtendedInfo2 = await this.contract.planetsExtendedInfo2(decStrId);
      const rawArenaInfo = await this.contract.planetsArenaInfo(decStrId);
      
      // Decode planet data
      const planet = decodePlanet(
        decStrId,
        rawPlanet,
        rawExtendedInfo,
        rawExtendedInfo2,
        rawArenaInfo
      );
      
      return planet;
    } catch (error) {
      logger.error(`Error getting planet data: ${logger.formatError(error)}`);
      return undefined;
    }
  }

  /**
   * Gets the planet by its ID using the contract method.
   * This is an alias for getPlanetWithId for compatibility with CaptureZoneGenerator.
   */
  public async getPlanet(locationId: LocationId): Promise<any> {
    return this.getPlanetWithId(locationId);
  }

  /**
   * Gets the distance between two coordinates in space.
   */
  public getDistCoords(fromCoords: WorldCoords, toCoords: WorldCoords): number {
    return Math.sqrt((fromCoords.x - toCoords.x) ** 2 + (fromCoords.y - toCoords.y) ** 2);
  }

  /**
   * Calculates the time it will take to move from one location to another.
   * @param fromId The ID of the source planet
   * @param toId The ID of the destination planet
   * @returns The time it will take to make the move in seconds
   */
  public async getTimeForMove(fromId: LocationId, toId: LocationId): Promise<number> {
    const from = await this.getPlanetWithId(fromId);
    if (!from) throw new Error('origin planet unknown');
    
    // Get coordinates for both planets to calculate distance
    // First get from planet coordinates
    let fromCoords, toCoords;
    
    if (from.location?.coords) {
      fromCoords = from.location.coords;
    } else if (from.coords) {
      fromCoords = from.coords;
    } else {
      throw new Error('Could not get coordinates for source planet');
    }
    
    // Get to planet coordinates
    const to = await this.getPlanetWithId(toId);
    if (to) {
      if (to.location?.coords) {
        toCoords = to.location.coords;
      } else if (to.coords) {
        toCoords = to.coords;
      }
    }
    
    if (!toCoords) {
      throw new Error('Could not get coordinates for destination planet');
    }
    
    const dist = this.getDistCoords(fromCoords, toCoords);
    // TODO: THIS IS SIMPLIFIED AND SHOULD FACTOR IN WORMHOLES IN THE FUTURE
    
    const speed = typeof from.speed === 'string' ? parseFloat(from.speed) : from.speed;
    return dist / (speed / 100);
  }

  /**
   * Gets the maximuim distance that you can send your energy from the given planet
   * using the given percentage of that planet's current silver.
   * @param planetId The ID of the source planet
   * @param sendingPercent Percentage of silver to use (0-100)
   * @returns The maximum distance the player can move
   */
  public async getMaxMoveDist(planetId: LocationId, sendingPercent: number): Promise<number> {
    const planet = await this.getPlanetWithId(planetId);
    if (!planet) throw new Error('origin planet unknown');
    return this.getRange(planet, sendingPercent, 1);
  }

  /**
   * Calculate the maximum range a planet can send energy based on its stats and resources
   * @param planet The planet object
   * @param sendingPercent The percentage of the planet's silver to use (0-100)
   * @param abandoning Whether the planet is being abandoned (1 = yes, 0 = no)
   * @returns The maximum range in world coordinates
   */
  private getRange(planet: any, sendingPercent: number, abandoning: number): number {
    // Default implementation - can be adjusted based on actual game mechanics
    // This is a placeholder implementation
    const silverFactor = sendingPercent / 100;
    const silver = typeof planet.silver === 'string' ? parseFloat(planet.silver as string) : (planet.silver as number);
    const silverBoost = (silverFactor * silver) / 100000;
    const speed = typeof planet.speed === 'string' ? parseFloat(planet.speed as string) : (planet.speed as number);
    const range = (speed / 100) * 50 * (1 + silverBoost); // Base range * silver boost
    
    // If abandoning, provide extra range 
    const abandonBonus = abandoning === 1 ? 1.5 : 1;
    
    return range * abandonBonus;
  }

  /** TOOLS =========================================================================== */
} 
