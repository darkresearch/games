import { Connection } from '@solana/web3.js';
import { walletStore } from '$lib/wallet/walletStore.svelte';
import toast from 'svelte-french-toast';

const LOCAL_STORAGE_KEY = 'solana-walletaddress';
export function getLocalStorageWalletAddress() {
	return localStorage.getItem(LOCAL_STORAGE_KEY);
}

// Check if Phantom wallet is available
export const checkWallet = async () => {
	if (window.solana || window.solflare || window.backpack) {
		console.info('Wallet found!');
		if (window.solana) {
			return window.solana;
		} else if (window.solflare) {
			return window.solflare;
		} else if (window.backpack) {
			return window.backpack;
		}
	} else {
		console.warn('Wallet not found. Please install it.');
		toast.error('Wallet not found');

		return null;
	}
};

// Connect to the wallet
export const connectWallet = async (connection?: Connection) => {
	const wallet = await checkWallet();
	if (!wallet) return;
	try {
		const response = await wallet.connect();

		const walletAddress = wallet.publicKey?.toString() ?? null;

		if (!walletAddress) {
			toast.error('Wallet connection failed');
			throw new Error('Wallet connection failed');
		}

		// TODO: replace this with api - rpc will be handled by backend
		const balance = 1;

		// update wallet store with wallet address and balance
		walletStore.update((store) => ({
			...store,
			walletAddress,
			balance: 1
		}));

		// store wallet address in local storage
		localStorage.setItem(LOCAL_STORAGE_KEY, walletAddress);

		return { walletAddress, balance };
	} catch (error) {
		toast.error('Wallet connection failed: ' + error);
		console.error('Wallet connection failed:', error);
	}
};

export const disconnectWallet = async () => {
	const wallet = await checkWallet();
	if (!wallet) return;
	try {
		// Disconnect the wallet
		await wallet.disconnect();

		localStorage.removeItem(LOCAL_STORAGE_KEY);

		// Clear wallet information from the store
		walletStore.update((store) => ({
			...store,
			walletAddress: null,
			balance: 0
		}));

		// Optional: Clear other session data if needed
		// For example, if you store token data or other wallet-related data in localStorage or sessionStorage
	} catch (error) {
		console.error('Wallet disconnection failed:', error);
	}
};
