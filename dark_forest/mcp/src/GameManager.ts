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
} from "@darkforest_eth/types";
import { providers, BigNumber, BigNumberish, Contract } from "ethers";
import { EventEmitter } from "events";
import { DarkForest } from "@darkforest_eth/contracts/typechain";
import { EMPTY_ADDRESS } from "@darkforest_eth/constants";

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

export class GameManager extends EventEmitter {
  private readonly ethConnection: EthConnection;
  private readonly contractAddress: EthAddress;
  private readonly account: EthAddress;
  private readonly contract: DarkForest;
  private txIdCounter: number = 0;
  private discoveredPlanets: Set<LocationId> = new Set();
  private planets: Map<LocationId, Planet> = new Map();
  private players: Map<string, { claimedShips: boolean }> = new Map();

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

  private createTxIntent(methodName: string, args: unknown[]): TxIntent {
    return {
      methodName,
      contract: this.contract as Contract,
      args: Promise.resolve(args),
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

  public async move(
    fromId: LocationId,
    toId: LocationId,
    forces: number,
    silver: number = 0,
    artifactId?: ArtifactId
  ): Promise<Transaction> {
    const fromCoords = await this.locationIdToCoords(fromId);
    const toCoords = await this.locationIdToCoords(toId);
    
    const proof = await this.generateMoveProof(fromCoords, toCoords, forces, silver, artifactId);

    const input: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, 
                 BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish,
                 BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
      fromId,
      toId,
      0, // perlin value
      1000, // radius
      1000, // maxDist
      0, // snarkF1
      0, // snarkF2
      0, // snarkF3
      0, // snarkF4
      0, // snarkF5
      BigNumber.from(forces),
      BigNumber.from(silver),
      artifactId || 0,
      0 // abandoning
    ];

    const tx = await this.contract.move(
      proof.a,
      proof.b,
      proof.c,
      input
    );

    const intent = this.createTxIntent('move', [fromId, toId, forces, silver, artifactId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;

    return transaction;
  }

  private async locationIdToCoords(locationId: LocationId): Promise<WorldCoords> {
    // Get the planet data from the contract
    const planet = await this.contract.planets(locationId);
    if (!planet) {
      throw new Error(`Planet ${locationId} not found`);
    }
    
    return {
      x: BigNumber.from(planet[2]).toNumber(),
      y: BigNumber.from(planet[3]).toNumber()
    };
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

  private async generateInitProof(
    x: number,
    y: number,
    r: number,
    distFromOrigin: number
  ): Promise<ZKProof> {
    // Placeholder for actual ZK proof generation
    return {
      a: [0, 0],
      b: [[0, 0], [0, 0]],
      c: [0, 0]
    };
  }

  public async initializePlayer(
    x: number,
    y: number,
    r: number,
    distFromOrigin: number
  ): Promise<Transaction> {
    const proof = await this.generateInitProof(x, y, r, distFromOrigin);
    
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

    const intent = this.createTxIntent('initializePlayer', [x, y, r, distFromOrigin]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;

    return transaction;
  }

  private async generateRevealProof(
    planetId: LocationId,
    x: number,
    y: number,
    r: number
  ): Promise<ZKProof> {
    // This would need to be implemented to generate actual ZK proofs
    // For now return dummy values that match the expected types
    return {
      a: [0, 0],
      b: [[0, 0], [0, 0]],
      c: [0, 0]
    };
  }

  public async revealLocation(
    planetId: LocationId,
    x: number,
    y: number,
    r: number
  ): Promise<Transaction> {
    const proof = await this.generateRevealProof(planetId, x, y, r);
    
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
    
    const intent = this.createTxIntent('revealLocation', [planetId, x, y, r]);
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

  public async upgrade(
    planetId: LocationId,
    branch: number
  ): Promise<Transaction> {
    const tx = await this.contract.upgradePlanet(planetId, branch);
    const intent = this.createTxIntent('upgrade', [planetId, branch]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async buyHat(
    planetId: LocationId
  ): Promise<Transaction> {
    const tx = await this.contract.buyHat(planetId);
    const intent = this.createTxIntent('buyHat', [planetId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async depositArtifact(
    locationId: LocationId,
    artifactId: ArtifactId
  ): Promise<Transaction> {
    const tx = await this.contract.depositArtifact(locationId, artifactId);
    const intent = this.createTxIntent('depositArtifact', [locationId, artifactId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async withdrawArtifact(
    locationId: LocationId,
    artifactId: ArtifactId
  ): Promise<Transaction> {
    const tx = await this.contract.withdrawArtifact(locationId, artifactId);
    const intent = this.createTxIntent('withdrawArtifact', [locationId, artifactId]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async activateArtifact(
    locationId: LocationId,
    artifactId: ArtifactId,
    wormholeTo?: LocationId
  ): Promise<Transaction> {
    const tx = await this.contract.activateArtifact(
      locationId,
      artifactId,
      wormholeTo || '0'
    );
    const intent = this.createTxIntent('activateArtifact', [locationId, artifactId, wormholeTo]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  public async withdrawSilver(
    locationId: LocationId,
    amount: number
  ): Promise<Transaction> {
    const tx = await this.contract.withdrawSilver(locationId, amount);
    const intent = this.createTxIntent('withdrawSilver', [locationId, amount]);
    const transaction = this.createTransaction(intent);
    transaction.hash = tx.hash;
    return transaction;
  }

  private coordsToLocationId(coords: WorldCoords): LocationId {
    // Implementation here - this should return a LocationId string
    return '0000000000000000000000000000000000000000000000000000000000000000' as LocationId;
  }

  public async getCoords(locationId: LocationId): Promise<WorldCoords> {
    const planet = await this.contract.planets(locationId);
    if (!planet) {
      throw new Error(`Planet ${locationId} not found`);
    }
    
    // Assuming the contract returns an array where x and y coordinates are at specific indices
    // You'll need to verify these indices match your contract's return type
    return {
      x: BigNumber.from(planet[2]).toNumber(), // Adjust index based on your contract
      y: BigNumber.from(planet[3]).toNumber()  // Adjust index based on your contract
    };
  }
} 