import { EthConnection } from "@darkforest_eth/network";
import { EthAddress } from "@darkforest_eth/types";
import { providers } from "ethers";
import { GameManager } from "../GameManager";
import { WalletManager } from "../WalletManager";

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
          // Default hash config - in real implementation this would come from the contract
          planetHashKey: 1,
          spaceTypeKey: 2,
          biomeBaseKey: 3,
          perlinLengthScale: 1000,
          perlinMirrorX: false,
          perlinMirrorY: false,
          planetRarity: 16384
        }
      );
      
      // Initialize the GameManager
      await player.initialize();

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
} 