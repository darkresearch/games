import { writable, type Writable } from "svelte/store";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { Connection, PublicKey } from "@solana/web3.js";

// Create wallet store
export const walletStore: Writable<{
    wallet: WalletAdapter | null;
    publicKey: PublicKey | null;
    connection: Connection | null;
    connected: boolean;
    walletAddress: string | null;
    balance: number;
}> = writable({
    wallet: null,
    publicKey: null,
    connection: null,
    connected: false,
    walletAddress: null,
    balance: 0,
});
