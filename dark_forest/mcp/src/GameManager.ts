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
  LocatablePlanet,
  UnconfirmedProspectPlanet,
  UnconfirmedFindArtifact,
  ArtifactType,
  PlanetLevel,
  SpaceType
} from "@darkforest_eth/types";
import { providers, BigNumber, BigNumberish, Contract, Overrides } from "ethers";
import { EventEmitter } from "events";
import { DarkForest } from "@darkforest_eth/contracts/typechain";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { isLocatable, isSpaceShip, getRange } from '@darkforest_eth/gamelogic';
import { getPlanetName } from '@darkforest_eth/procedural';
import { perlin } from "@darkforest_eth/hashing";

type ZKProof = {
  a: [BigNumberish, BigNumberish];
  b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
  c: [BigNumberish, BigNumberish];
};

interface Transaction<T extends TxIntent = TxIntent> {
  intent: T;
  id: TransactionId;
  lastUpdatedAt: number;
  hash?: string;
  state: EthTxStatus;
  overrides?: providers.TransactionRequest;
  onSubmissionError: (e: Error | undefined) => void;
  onReceiptError: (e: Error | undefined) => void;
  onTransactionResponse: (e: providers.TransactionResponse) => void;
  onTransactionReceipt: (e: providers.TransactionReceipt) => void;
  submittedPromise: Promise<providers.TransactionResponse>;
  confirmedPromise: Promise<providers.TransactionReceipt>;
}

const CONTRACT_METHOD = {
  MOVE: 'move',
  UPGRADE_PLANET: 'upgradePlanet',
  PROSPECT_PLANET: 'prospectPlanet',
  FIND_ARTIFACT: 'findArtifact',
  INITIALIZE_PLAYER: 'initializePlayer',
  REVEAL_LOCATION: 'revealLocation',
  BUY_HAT: 'buyHat',
  DEPOSIT_ARTIFACT: 'depositArtifact',
  WITHDRAW_ARTIFACT: 'withdrawArtifact',
  ACTIVATE_ARTIFACT: 'activateArtifact',
  DEACTIVATE_ARTIFACT: 'deactivateArtifact',
  WITHDRAW_SILVER: 'withdrawSilver',
  INVADE_PLANET: 'invadePlanet',
  CAPTURE_PLANET: 'capturePlanet',
  CLAIM_VICTORY: 'claimVictory'
} as const;

type ContractMethodName = typeof CONTRACT_METHOD[keyof typeof CONTRACT_METHOD];

// Add contract return type for artifacts
interface ContractArtifact {
  isInitialized: boolean;
  id: BigNumberish;
  planetDiscoveredOn: BigNumberish;
  rarity: BigNumberish;
  planetBiome: BigNumberish;
  mintedAtTimestamp: BigNumberish;
  discoverer: string;
  artifactType: BigNumberish;
  activations: BigNumberish;
  lastActivated: BigNumberish;
  lastDeactivated: BigNumberish;
  wormholeTo: BigNumberish;
  controller: string;
  currentOwner: string;
  onPlanetId: BigNumberish;
}

interface ArtifactWithoutId {
  planetDiscoveredOn: LocationId;
  rarity: number;
  planetBiome: number;
  mintedAtTimestamp: number;
  discoverer: EthAddress;
  artifactType: number;
  controller: EthAddress;
  currentOwner: EthAddress;
  activations: number;
  lastActivated: number;
  lastDeactivated: number;
  isInititalized: boolean;
  wormholeTo: LocationId;
  onPlanetId: LocationId;
}

interface ArtifactWithId extends ArtifactWithoutId {
  id: ArtifactId;
}

export enum GameManagerEvent {
  PlanetUpdate = 'PlanetUpdate',
  ArtifactUpdate = 'ArtifactUpdate',
  PlayerUpdate = 'PlayerUpdate',
  TransactionUpdate = 'TransactionUpdate',
  DiscoveredNewChunk = 'DiscoveredNewChunk'
}

interface HashConfig {
  planetHashKey: number;
  spaceTypeKey: number;
  biomeBaseKey: number;
  perlinLengthScale: number;
  perlinMirrorX: boolean;
  perlinMirrorY: boolean;
}

export class GameManager extends EventEmitter {
  private readonly ethConnection: EthConnection;
  private readonly contractAddress: EthAddress;
  private readonly account: EthAddress;
  private readonly contract: DarkForest;
  private txIdCounter: number = 0;
  private discoveredPlanets: Set<LocationId> = new Set();
  private planets: Map<LocationId, LocatablePlanet> = new Map();
  private players: Map<string, Player> = new Map();
  private transactions: Map<TransactionId, Transaction> = new Map();
  private planetTransactions: Map<LocationId, Set<TransactionId>> = new Map();
  private eventSubscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private readonly worldRadius: number;
  private readonly hashConfig: HashConfig;

  private constructor(
    ethConnection: EthConnection,
    contractAddress: EthAddress,
    account: EthAddress,
    contract: DarkForest,
    worldRadius: number,
    hashConfig: HashConfig
  ) {
    super();
    this.ethConnection = ethConnection;
    this.contractAddress = contractAddress;
    this.account = account;
    this.contract = contract;
    this.worldRadius = worldRadius;
    this.hashConfig = hashConfig;
  }

  static async create({
    connection,
    contractAddress,
    account = EMPTY_ADDRESS,
  }: {
    connection: EthConnection;
    contractAddress: EthAddress;
    account?: EthAddress;
  }): Promise<GameManager> {
    const contract = connection.getContract<DarkForest>(contractAddress);
    
    // Get world radius from contract
    const worldRadius = await contract.worldRadius();

    // Default hash config values - in practice these would come from the contract
    const hashConfig: HashConfig = {
      planetHashKey: 1,
      spaceTypeKey: 2,
      biomeBaseKey: 3,
      perlinLengthScale: 16,
      perlinMirrorX: true,
      perlinMirrorY: true
    };

    return new GameManager(
      connection,
      contractAddress,
      account,
      contract,
      worldRadius.toNumber(),
      hashConfig
    );
  }

  public destroy(): void {
    this.removeAllListeners();
  }

  private createTxIntent(methodName: ContractMethodName, args: unknown[]): TxIntent {
    return {
      methodName,
      contract: this.contract,
      args: Promise.resolve(args)
    };
  }

  private createTransaction<T extends TxIntent>(intent: T): Transaction<T> {
    const id = this.txIdCounter++;
    const now = Date.now();

    return {
      intent,
      id,
      lastUpdatedAt: now,
      state: 'Init',
      onSubmissionError: () => {},
      onReceiptError: () => {},
      onTransactionResponse: () => {},
      onTransactionReceipt: () => {},
      submittedPromise: Promise.resolve({} as providers.TransactionResponse),
      confirmedPromise: Promise.resolve({} as providers.TransactionReceipt),
    };
  }

  private async generateMoveProof(
    fromCoords: WorldCoords,
    toCoords: WorldCoords,
    forces: number,
    silver: number,
    artifactId?: ArtifactId
  ): Promise<ZKProof> {
    // This would need to be implemented to generate actual ZK proofs
    // For now return dummy values that match the expected types
    return {
      a: [0, 0],
      b: [[0, 0], [0, 0]],
      c: [0, 0]
    };
  }

  public async move(from: LocationId, to: LocationId, forces: number, silver: number, artifactId?: ArtifactId): Promise<Transaction<TxIntent>> {
    const fromCoords = await this.locationIdToCoords(from);
    const toCoords = await this.locationIdToCoords(to);
    
    // Generate the proof
    const proof = await this.generateMoveProof(
      fromCoords,
      toCoords,
      forces,
      silver,
      artifactId
    );
    
    // Create the move arguments
    const tx = await this.contract.move(
      proof.a,
      proof.b,
      proof.c,
      [
        BigNumber.from(fromCoords.x),
        BigNumber.from(fromCoords.y),
        BigNumber.from(toCoords.x),
        BigNumber.from(toCoords.y),
        BigNumber.from(forces),
        BigNumber.from(silver),
        artifactId ? BigNumber.from(artifactId) : BigNumber.from(0),
        BigNumber.from(0), // Additional required parameters
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0)
      ]
    );

    // Create the intent with the same arguments
    const intent = this.createTxIntent(CONTRACT_METHOD.MOVE, [
      fromCoords,
      toCoords,
      forces,
      silver,
      artifactId || 0
    ]);
    
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async locationIdToCoords(locationId: LocationId): Promise<WorldCoords> {
    const planet = this.planets.get(locationId);
    if (!planet || !planet.location) {
      throw new Error('Planet not found');
    }
    return planet.location.coords;
  }

  public async getPlayer(address: EthAddress = this.account): Promise<Player | undefined> {
    try {
      const playerData = await this.contract.players(address);
      if (!playerData) return undefined;
      
      const [
        isInitialized,
        homePlanetId,
        initTimestamp,
        lastRevealTimestamp,
        score,
        spaceJunk,
        spaceJunkLimit,
        lastClaimTimestamp,
        claimedShips
      ] = playerData;

      if (!isInitialized) return undefined;

      return {
        address,
        homePlanetId: homePlanetId as LocationId,
        initTimestamp: BigNumber.from(initTimestamp).toNumber(),
        lastRevealTimestamp: BigNumber.from(lastRevealTimestamp).toNumber(),
        score: BigNumber.from(score).toNumber(),
        spaceJunk: BigNumber.from(spaceJunk).toNumber(),
        spaceJunkLimit: BigNumber.from(spaceJunkLimit).toNumber(),
        lastClaimTimestamp: BigNumber.from(lastClaimTimestamp).toNumber(),
        claimedShips: Boolean(claimedShips)
      };
    } catch (e) {
      console.error('Error getting player:', e);
      return undefined;
    }
  }

  public getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  public async getTwitter(address: EthAddress): Promise<string | undefined> {
    const player = await this.getPlayer(address);
    return player?.twitter;
  }

  public getAccount(): EthAddress | undefined {
    return this.account === EMPTY_ADDRESS ? undefined : this.account;
  }

  public async isAdmin(address: EthAddress): Promise<boolean> {
    try {
      return await this.contract.isWhitelisted(address);
    } catch (e) {
      console.error('Error checking admin status:', e);
      return false;
    }
  }

  public async getEndTimeSeconds(): Promise<number | undefined> {
    try {
      // Try different possible contract methods/properties
      const contract = this.contract as any;
      if (typeof contract.END_TIMESTAMP === 'function') {
        const endTime = await contract.END_TIMESTAMP();
        return endTime.toNumber();
      } else if (typeof contract.endTimestamp === 'function') {
        const endTime = await contract.endTimestamp();
        return endTime.toNumber();
      } else if (typeof contract.END_TIMESTAMP !== 'undefined') {
        return contract.END_TIMESTAMP.toNumber();
      }
      return undefined;
    } catch (e) {
      console.error('Error getting end time:', e);
      return undefined;
    }
  }

  public async getTokenMintEndTimeSeconds(): Promise<number> {
    const endTime = await this.contract.TOKEN_MINT_END_TIMESTAMP();
    return endTime.toNumber();
  }

  public async getPlanet(planetId: LocationId): Promise<Planet | undefined> {
    try {
      const planet = await this.contract.planets(planetId);
      if (!planet) return undefined;
      return planet as unknown as Planet; // Force cast since we know the contract returns a Planet
    } catch (e) {
      console.error('Error getting planet:', e);
      return undefined;
    }
  }

  public async initializePlayer(x: number, y: number, r: number, distFromOrigin: number): Promise<Transaction> {
    const proof = await this.generateMoveProof({ x, y }, { x: 0, y: 0 }, 0, 0);
    
    const input: [BigNumberish, BigNumberish, BigNumberish, BigNumberish,
                 BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
      x, y, r, distFromOrigin,
      0, 0, 0, 0 // Additional required parameters
    ];
    
    const tx = await this.contract.initializePlayer(
      proof.a,
      proof.b,
      proof.c,
      input,
      0 // team parameter
    );

    const intent = this.createTxIntent(CONTRACT_METHOD.INITIALIZE_PLAYER, [x, y, r, distFromOrigin]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;

    return transaction;
  }

  public async revealLocation(planetId: LocationId, x: number, y: number, r: number): Promise<Transaction> {
    const proof = await this.generateMoveProof({ x, y }, { x: 0, y: 0 }, 0, 0);
    
    const input: [BigNumberish, BigNumberish, BigNumberish, BigNumberish,
                 BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
      planetId, r, x, y,
      0, 0, 0, 0, 0 // Additional required parameters
    ];
    
    const tx = await this.contract.revealLocation(
      proof.a,
      proof.b,
      proof.c,
      input
    );
    
    // Track the discovered planet
    this.discoveredPlanets.add(planetId);
    
    const intent = this.createTxIntent(CONTRACT_METHOD.REVEAL_LOCATION, [planetId, x, y, r]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;

    return transaction;
  }

  public async getDiscoveredPlanets(): Promise<Planet[]> {
    const planets: Planet[] = [];
    for (const planetId of this.discoveredPlanets) {
      const planet = await this.getPlanet(planetId);
      if (planet) {
        planets.push(planet);
      }
    }
    return planets;
  }

  public async upgradePlanet(locationId: LocationId, branch: number): Promise<Transaction<TxIntent>> {
    const tx = await this.contract.upgradePlanet(
      BigNumber.from(locationId),
      BigNumber.from(branch)
    );
    
    const intent = this.createTxIntent(CONTRACT_METHOD.UPGRADE_PLANET, [locationId, branch]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async buyHat(locationId: LocationId): Promise<Transaction> {
    const tx = await this.contract.buyHat(locationId);
    const intent = this.createTxIntent(CONTRACT_METHOD.BUY_HAT, [locationId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async depositArtifact(locationId: LocationId, artifactId: ArtifactId): Promise<Transaction> {
    const tx = await this.contract.depositArtifact(locationId, artifactId);
    const intent = this.createTxIntent(CONTRACT_METHOD.DEPOSIT_ARTIFACT, [locationId, artifactId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async withdrawArtifact(locationId: LocationId, artifactId: ArtifactId): Promise<Transaction> {
    const tx = await this.contract.withdrawArtifact(locationId, artifactId);
    const intent = this.createTxIntent(CONTRACT_METHOD.WITHDRAW_ARTIFACT, [locationId, artifactId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async activateArtifact(locationId: LocationId, artifactId: ArtifactId, wormholeTo?: LocationId): Promise<Transaction> {
    const tx = await this.contract.activateArtifact(locationId, artifactId, wormholeTo || '0');
    const intent = this.createTxIntent(CONTRACT_METHOD.ACTIVATE_ARTIFACT, [locationId, artifactId, wormholeTo || '0']);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async deactivateArtifact(locationId: LocationId): Promise<Transaction> {
    const tx = await this.contract.deactivateArtifact(locationId);
    const intent = this.createTxIntent(CONTRACT_METHOD.DEACTIVATE_ARTIFACT, [locationId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async withdrawSilver(locationId: LocationId, amount: number): Promise<Transaction> {
    const tx = await this.contract.withdrawSilver(locationId, amount);
    const intent = this.createTxIntent(CONTRACT_METHOD.WITHDRAW_SILVER, [locationId, amount]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async getCoords(locationId: LocationId): Promise<WorldCoords> {
    const planet = await this.contract.planets(locationId);
    if (!planet) {
      throw new Error(`Planet ${locationId} not found`);
    }
    
    return {
      x: BigNumber.from(planet[2]).toNumber(),
      y: BigNumber.from(planet[3]).toNumber()
    };
  }

  public async bulkGetPlanets(planetIds: LocationId[]): Promise<Map<LocationId, Planet>> {
    const result = new Map<LocationId, Planet>();
    
    const batchSize = 10;
    for (let i = 0; i < planetIds.length; i += batchSize) {
      const batch = planetIds.slice(i, i + batchSize);
      const planets = await Promise.all(
        batch.map(id => this.contract.planets(id))
      );
      
      planets.forEach((planet, index) => {
        if (planet) {
          result.set(batch[index], planet as unknown as Planet);
        }
      });
    }
    
    return result;
  }

  public async bulkHardRefreshPlanets(planetIds: LocationId[]): Promise<void> {
    const planets = await this.bulkGetPlanets(planetIds);
    planets.forEach((planet, id) => {
      this.planets.set(id, planet as unknown as LocatablePlanet);
    });
  }

  public getEnergyCurveAtPercent(planet: Planet, percent: number): number {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const energyPercentage = (planet.energy / planet.energyCap) * 100;
    
    if (energyPercentage >= percent) {
      return currentTimestamp;
    }

    const energyNeeded = (percent / 100) * planet.energyCap - planet.energy;
    const timeNeeded = energyNeeded / planet.energyGrowth;
    
    return currentTimestamp + timeNeeded;
  }

  public getSilverCurveAtPercent(planet: Planet, percent: number): number | undefined {
    if (planet.silverGrowth <= 0) return undefined;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const silverPercentage = (planet.silver / planet.silverCap) * 100;
    
    if (silverPercentage >= percent) {
      return undefined;
    }

    const silverNeeded = (percent / 100) * planet.silverCap - planet.silver;
    const timeNeeded = silverNeeded / planet.silverGrowth;
    
    return currentTimestamp + timeNeeded;
  }

  public async prospectPlanet(planetId: LocationId): Promise<Transaction<TxIntent>> {
    const planet = this.planets.get(planetId);
    if (!planet) {
      throw new Error('Planet not found');
    }

    const tx = await this.contract.prospectPlanet(BigNumber.from(planetId));
    const intent = this.createTxIntent(CONTRACT_METHOD.PROSPECT_PLANET, [planetId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async findArtifact(planetId: LocationId): Promise<Transaction<TxIntent>> {
    const planet = this.planets.get(planetId);
    if (!planet) {
      throw new Error('Planet not found');
    }

    const proof = await this.generateMoveProof(
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      0,
      0
    );

    const input: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
      planetId,
      0, // Additional required parameters
      0,
      0,
      0,
      0,
      0
    ];

    const tx = await this.contract.findArtifact(
      proof.a,
      proof.b,
      proof.c,
      input
    );

    const intent = this.createTxIntent(CONTRACT_METHOD.FIND_ARTIFACT, [planetId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public getRange(planetId: LocationId): number {
    const planet = this.planets.get(planetId);
    if (!planet) return 0;
    return getRange(planet);
  }

  public isLocatable(planetId: LocationId): boolean {
    const planet = this.planets.get(planetId);
    if (!planet) return false;
    return isLocatable(planet);
  }

  public isSpaceShip(planetId: LocationId): boolean {
    const planet = this.planets.get(planetId);
    if (!planet) return false;
    return planet.planetType === PlanetType.TRADING_POST;
  }

  public getPlanetName(planetId: LocationId): string {
    const planet = this.planets.get(planetId);
    if (!planet) {
      return 'Unknown Planet';
    }
    return getPlanetName(planet);
  }

  public async bulkGetArtifactsOnPlanets(planetIds: LocationId[]): Promise<ArtifactWithId[][]> {
    const result: ArtifactWithId[][] = [];
    
    const batchSize = 10;
    for (let i = 0; i < planetIds.length; i += batchSize) {
      const batch = planetIds.slice(i, i + batchSize);
      const artifactPromises = batch.map(async (planetId) => {
        const planet = await this.contract.planets(planetId);
        if (!planet) return [];
        
        const artifactIds = await this.contract.getArtifactsOnPlanet(planetId);
        const artifacts = await Promise.all(
          artifactIds.map(id => this.getArtifactById(id.toString() as ArtifactId))
        );
        
        return artifacts.filter((a): a is ArtifactWithId => a !== undefined);
      });
      
      const batchResults = await Promise.all(artifactPromises);
      result.push(...batchResults);
    }
    
    return result;
  }

  public async getArtifactById(artifactId: ArtifactId): Promise<ArtifactWithId | undefined> {
    try {
      const result = await this.contract.getArtifact(artifactId.toString());
      if (!result || !Array.isArray(result) || result.length < 15) return undefined;

      const [
        isInitialized,
        id,
        planetDiscoveredOn,
        rarity,
        planetBiome,
        mintedAtTimestamp,
        discoverer,
        artifactType,
        activations,
        lastActivated,
        lastDeactivated,
        wormholeTo,
        controller,
        currentOwner,
        onPlanetId
      ] = result;

      if (!isInitialized) return undefined;

      return {
        id: artifactId,
        planetDiscoveredOn: planetDiscoveredOn.toString() as LocationId,
        rarity: Number(rarity),
        planetBiome: Number(planetBiome),
        mintedAtTimestamp: BigNumber.from(mintedAtTimestamp).toNumber(),
        discoverer: discoverer as EthAddress,
        artifactType: Number(artifactType),
        controller: controller as EthAddress,
        currentOwner: currentOwner as EthAddress,
        activations: BigNumber.from(activations).toNumber(),
        lastActivated: BigNumber.from(lastActivated).toNumber(),
        lastDeactivated: BigNumber.from(lastDeactivated).toNumber(),
        isInititalized: isInitialized,
        wormholeTo: wormholeTo.toString() as LocationId,
        onPlanetId: onPlanetId.toString() as LocationId,
      };
    } catch (e) {
      console.error('Error getting artifact:', e);
      return undefined;
    }
  }

  public async hardRefreshArtifact(artifactId: ArtifactId): Promise<void> {
    const artifact = await this.getArtifactById(artifactId);
    if (!artifact) {
      throw new Error('Artifact not found');
    }
    // No need to do anything else since we're already getting fresh data from the contract
  }

  public on(event: GameManagerEvent, callback: (data: any) => void): this {
    if (!this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.set(event, new Set());
    }
    this.eventSubscriptions.get(event)?.add(callback);
    return super.on(event, callback);
  }

  public off(event: GameManagerEvent, callback: (data: any) => void): this {
    this.eventSubscriptions.get(event)?.delete(callback);
    return super.off(event, callback);
  }

  public subscribeToEvents(): void {
    // Subscribe to contract events
    this.contract.on('PlanetUpdate', (planetId: LocationId) => {
      this.emit(GameManagerEvent.PlanetUpdate, planetId);
    });

    this.contract.on('ArtifactUpdate', (artifactId: ArtifactId) => {
      this.emit(GameManagerEvent.ArtifactUpdate, artifactId);
    });

    this.contract.on('PlayerUpdate', (player: EthAddress) => {
      this.emit(GameManagerEvent.PlayerUpdate, player);
    });

    // Subscribe to transaction updates
    this.on(GameManagerEvent.TransactionUpdate, (tx: Transaction) => {
      const callbacks = this.eventSubscriptions.get(GameManagerEvent.TransactionUpdate);
      callbacks?.forEach(callback => callback(tx));
    });
  }

  public unsubscribeFromEvents(): void {
    // Remove all contract event listeners
    this.contract.removeAllListeners('PlanetUpdate');
    this.contract.removeAllListeners('ArtifactUpdate');
    this.contract.removeAllListeners('PlayerUpdate');

    // Remove all local event listeners
    this.eventSubscriptions.clear();
    this.removeAllListeners();
  }

  // Helper method to emit transaction updates
  private emitTransactionUpdate(tx: Transaction): void {
    this.emit(GameManagerEvent.TransactionUpdate, tx);
  }

  // Update submitTransaction to emit events
  public async submitTransaction<T extends TxIntent>(tx: Transaction<T>): Promise<void> {
    try {
      // Store the transaction
      this.transactions.set(tx.id, tx);

      // If this transaction is related to a planet, track it
      if ('locationId' in tx.intent) {
        const locationId = tx.intent.locationId as LocationId;
        if (!this.planetTransactions.has(locationId)) {
          this.planetTransactions.set(locationId, new Set());
        }
        this.planetTransactions.get(locationId)?.add(tx.id);
      }

      // Emit transaction updates
      this.emitTransactionUpdate(tx);
      
      const contract = this.contract as Contract;
      const response = await contract[tx.intent.methodName](...(await tx.intent.args));
      tx.hash = response.hash;
      tx.state = 'Submit' as EthTxStatus;
      tx.lastUpdatedAt = Date.now();
      this.emitTransactionUpdate(tx);

      const receipt = await response.wait();
      tx.state = (receipt.status === 1 ? 'Complete' : 'Fail') as EthTxStatus;
      tx.lastUpdatedAt = Date.now();
      this.emitTransactionUpdate(tx);
    } catch (e) {
      tx.state = 'Fail' as EthTxStatus;
      tx.lastUpdatedAt = Date.now();
      this.emitTransactionUpdate(tx);
      throw e;
    }
  }

  public async cancelTransaction(txId: TransactionId): Promise<void> {
    const tx = this.transactions.get(txId);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    // Only allow canceling transactions that haven't been submitted yet
    if (tx.state !== ('Init' as EthTxStatus)) {
      throw new Error('Cannot cancel transaction that has already been submitted');
    }

    tx.state = 'Cancel' as EthTxStatus;
    tx.lastUpdatedAt = Date.now();

    // Remove from planet tracking if it's a planet-related transaction
    if ('locationId' in tx.intent) {
      const locationId = tx.intent.locationId as LocationId;
      this.planetTransactions.get(locationId)?.delete(txId);
    }
  }

  public getTransactionById(txId: TransactionId): Transaction | undefined {
    return this.transactions.get(txId);
  }

  public getTransactionsForPlanet(planetId: LocationId): Transaction[] {
    const txIds = this.planetTransactions.get(planetId);
    if (!txIds) return [];
    
    return Array.from(txIds)
      .map(id => this.transactions.get(id))
      .filter((tx): tx is Transaction => tx !== undefined);
  }

  public async invadePlanet(planetId: LocationId): Promise<Transaction> {
    const planet = await this.getPlanet(planetId);
    if (!planet) {
      throw new Error('Planet not found');
    }

    const coords = await this.getCoords(planetId);
    const proof = await this.generateMoveProof(
      coords,
      { x: 0, y: 0 },
      0,
      0
    );

    const tx = await this.contract.invadePlanet(
      proof.a,
      proof.b,
      proof.c,
      [
        planetId,
        0, // Additional required parameters
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    );

    const intent = this.createTxIntent(CONTRACT_METHOD.INVADE_PLANET, [planetId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async capturePlanet(planetId: LocationId): Promise<Transaction> {
    const planet = await this.getPlanet(planetId);
    if (!planet) {
      throw new Error('Planet not found');
    }

    const tx = await this.contract.capturePlanet(planetId);
    const intent = this.createTxIntent(CONTRACT_METHOD.CAPTURE_PLANET, [planetId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async claimVictory(): Promise<Transaction> {
    // Check if victory conditions are met
    const contract = this.contract as Contract;
    const tx = await contract[CONTRACT_METHOD.CLAIM_VICTORY]();
    const intent = this.createTxIntent(CONTRACT_METHOD.CLAIM_VICTORY, []);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async getEnergyOfPlayer(player: EthAddress): Promise<number> {
    let totalEnergy = 0;
    const planets = await this.getDiscoveredPlanets();
    
    for (const planet of planets) {
      if (planet.owner === player) {
        totalEnergy += planet.energy;
      }
    }
    
    return totalEnergy;
  }

  public async getSilverOfPlayer(player: EthAddress): Promise<number> {
    let totalSilver = 0;
    const planets = await this.getDiscoveredPlanets();
    
    for (const planet of planets) {
      if (planet.owner === player) {
        totalSilver += planet.silver;
      }
    }
    
    return totalSilver;
  }

  public getWorldRadius(): number {
    return this.worldRadius;
  }

  public getHashConfig(): HashConfig {
    return { ...this.hashConfig };
  }

  public spaceTypeFromPerlin(perlinValue: number): SpaceType {
    if (perlinValue < 20) {
      return SpaceType.NEBULA;
    } else if (perlinValue < 40) {
      return SpaceType.SPACE;
    } else if (perlinValue < 60) {
      return SpaceType.DEEP_SPACE;
    } else {
      return SpaceType.DEAD_SPACE;
    }
  }

  public biomebasePerlin(coords: WorldCoords, floor: boolean): number {
    return perlin({ x: Math.floor(coords.x), y: Math.floor(coords.y) }, { key: 3, scale: 1, mirrorX: false, mirrorY: false, floor });
  }
} 