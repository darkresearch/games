import { Wallet } from "ethers";
import { EthAddress } from "@darkforest_eth/types";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Manages agent wallets for the Dark Forest MCP
 * Generates and stores keypairs with proper Ethereum addresses
 */
export class WalletManager {
  private wallets: Map<EthAddress, Wallet> = new Map();
  private walletStoragePath: string;

  constructor() {
    // Create a storage location for persisting wallets
    this.walletStoragePath = path.join(__dirname, '../data/wallets.json');
    this.ensureDirectoryExists(path.dirname(this.walletStoragePath));
    this.loadWallets();
  }

  /**
   * Generate a new wallet and return the address
   * Agents can use this to get a new Ethereum address
   */
  public generateWallet(): EthAddress {
    // Create a new wallet
    const wallet = Wallet.createRandom();
    const address = wallet.address as EthAddress;
    
    console.log(`Generated new wallet with address: ${address}`);
    
    // Store the wallet
    this.wallets.set(address, wallet);
    this.saveWallets();
    
    return address;
  }

  /**
   * Get an existing wallet by address
   * Returns undefined if no wallet exists for this address
   */
  public getWallet(address: EthAddress): Wallet | undefined {
    return this.wallets.get(address);
  }

  /**
   * Check if a wallet exists for an address
   */
  public hasWallet(address: EthAddress): boolean {
    return this.wallets.has(address);
  }

  /**
   * Load wallets from storage
   */
  private loadWallets(): void {
    try {
      if (fs.existsSync(this.walletStoragePath)) {
        const data = fs.readFileSync(this.walletStoragePath, 'utf8');
        const walletData = JSON.parse(data);
        
        for (const [address, privateKey] of Object.entries(walletData)) {
          this.wallets.set(address as EthAddress, new Wallet(privateKey as string));
        }
        
        console.log(`Loaded ${this.wallets.size} agent wallets`);
      } else {
        console.log('No wallet data found, starting with empty wallet storage');
      }
    } catch (e) {
      console.error('Error loading wallets:', e);
      // Continue with empty wallet storage
    }
  }

  /**
   * Save wallets to storage
   */
  private saveWallets(): void {
    try {
      const walletData: Record<string, string> = {};
      
      for (const [address, wallet] of this.wallets.entries()) {
        walletData[address] = wallet.privateKey;
      }
      
      fs.writeFileSync(this.walletStoragePath, JSON.stringify(walletData, null, 2));
    } catch (e) {
      console.error('Error saving wallets:', e);
    }
  }

  /**
   * Ensure the wallet storage directory exists
   */
  private ensureDirectoryExists(directory: string): void {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }
} 