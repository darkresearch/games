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
  PlanetLevel
} from "@darkforest_eth/types";
import { providers, BigNumber, BigNumberish, Contract, Overrides } from "ethers";
import { EventEmitter } from "events";
import { DarkForest } from "@darkforest_eth/contracts/typechain";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";
import { isLocatable, isSpaceShip, getRange } from '@darkforest_eth/gamelogic';
import { getPlanetName } from '@darkforest_eth/procedural';

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
  WITHDRAW_SILVER: 'withdrawSilver'
} as const;

type ContractMethodName = typeof CONTRACT_METHOD[keyof typeof CONTRACT_METHOD];

export class GameManager extends EventEmitter {
  private readonly ethConnection: EthConnection;
  private readonly contractAddress: EthAddress;
  private readonly account: EthAddress;
  private readonly contract: DarkForest;
  private txIdCounter: number = 0;
  private discoveredPlanets: Set<LocationId> = new Set();
  private planets: Map<LocationId, LocatablePlanet> = new Map();
  private players: Map<string, Player> = new Map();

  private constructor(
    ethConnection: EthConnection,
    contractAddress: EthAddress,
    account: EthAddress,
    contract: DarkForest
  ) {
    super();
    this.ethConnection = ethConnection;
    this.contractAddress = contractAddress;
    this.account = account;
    this.contract = contract;
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
    return new GameManager(connection, contractAddress, account, contract);
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
      input
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
} 