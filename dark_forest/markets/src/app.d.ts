// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		Buffer: typeof import('buffer').Buffer;
		solana?: SolanaProvider;
		solflare?: SolanaProvider;
		backpack?: SolanaProvider;
	}

	// Defining the SolanaProvider interface
	interface SolanaProvider {
		isPhantom?: boolean; // Indicates if the wallet is Phantom
		isSolflare?: boolean; // Indicates if the wallet is Solflare
		isBackpack?: boolean; // Indicates if the wallet is Backpack
		publicKey?: {
			toString(): string; // Returns the wallet address as a string
			toBytes(): Uint8Array; // Returns the wallet address as bytes
		};
		connect(): Promise<{ publicKey: { toString(): string } }>; // Connects to the wallet
		disconnect(): Promise<void>; // Disconnects the wallet
		signTransaction?: (transaction: any) => Promise<any>; // Signs a transaction
		signAndSendTransaction?: (transaction: any) => Promise<any>; // Signs a transaction
		signAllTransactions?: (transactions: any[]) => Promise<any[]>; // Signs multiple transactions
		signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>; // Signs a message
		on(event: string, callback: (...args: any[]) => void): void; // Subscribes to events
		off(event: string, callback: (...args: any[]) => void): void; // Unsubscribes from events
	}
}

export {};
