import { EthConnection } from "@darkforest_eth/network";
import { EthAddress } from "@darkforest_eth/types";
import { providers } from "ethers";
import { GameManager } from "../GameManager";

/**
 * Manages GameManager instances for each player
 */
export class PlayerRegistry {
  private players: Map<EthAddress, GameManager> = new Map();
  private ethConnection: EthConnection;
  private contractAddress: EthAddress;

  constructor(contractAddress: EthAddress, networkId: number) {
    this.contractAddress = contractAddress;
    
    // Get JSON RPC URL from environment variable, default to localhost if not set
    const jsonRpcUrl = process.env.DARK_FOREST_JSON_RPC_URL || "http://localhost:8545";
    const provider = new providers.JsonRpcProvider(jsonRpcUrl);
    
    // Use provided network ID
    this.ethConnection = new EthConnection(provider, networkId);
  }

  async getOrCreatePlayer(address: EthAddress): Promise<GameManager> {
    let player = this.players.get(address);
    if (!player) {
      // Create new GameManager instance
      player = await GameManager.create({
        connection: this.ethConnection,
        contractAddress: this.contractAddress,
        account: address,
      });

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
      player.destroy();
      this.players.delete(address);
    }
  }
} 