import { Monomitter } from '@darkforest_eth/events';
import { AutoGasSetting, DiagnosticUpdater, EthAddress, GasPrices, SignedMessage } from '@darkforest_eth/types';
import { BigNumber, Contract, EventFilter, providers, Wallet } from 'ethers';
import { ContractLoader } from './Contracts';
/**
 * Responsible for
 * 1) loading the contracts
 * 2) connecting to the network
 */
export declare class EthConnection {
    /**
     * Keep a reference to all the contracts this {@link EthConnection} has loaded so that they can be
     * reloaded if the RPC url changes.
     *
     * Keyed by the contract address.
     */
    private contracts;
    /**
     * Keep a reference to all the contract loaders this {@link EthConnection} has loaded
     * so that they can be reloaded if the RPC url changes.
     *
     * Keyed by the contract address.
     */
    private loaders;
    /**
     * Allows {@link EthConnection} to update the global diagnostics, which are displayed in the game
     * client's diagnostics pane.
     */
    private diagnosticsUpdater;
    /**
     * Publishes an event whenever the current block number changes. Can skip block numbers.
     */
    readonly blockNumber$: Monomitter<number>;
    /**
     * Publishes an event whenever the network's auto gas prices change.
     */
    readonly gasPrices$: Monomitter<GasPrices>;
    /**
     * It is possible to instantiate an EthConnection without a signer, in which case it is still able
     * to connect to the blockchain, without the ability to send transactions.
     */
    private signer;
    /**
     * Represents the gas price one would pay to achieve the corresponding transaction confirmation
     * speed.
     */
    private gasPrices;
    /**
     * Store this so we can cancel the interval.
     */
    private gasPricesInterval;
    /**
     * Interval which reloads the balance of the account that this EthConnection is in charge of.
     */
    private balanceInterval;
    /**
     * The current latest block number.
     */
    private blockNumber;
    /**
     * The provider is the lowest level interface we use to communicate with the blockchain.
     */
    private provider;
    /**
     * Whenever the RPC url changes, we reload the contract, and also publish an event here.
     */
    rpcChanged$: Monomitter<string>;
    /**
     * This is kept relatively up-to-date with the balance of the player's wallet on the latest block
     * of whatever blockchain we're connected to.
     */
    private balance;
    /**
     * Any time the balance of the player's address changes, we publish an event here.
     */
    readonly myBalance$: Monomitter<BigNumber>;
    constructor(provider: providers.JsonRpcProvider, blockNumber: number);
    private reloadContracts;
    /**
     * Loads a contract into this {@link EthConnection}.
     *
     * @param address The contract address to register the contract against.
     * @param loader The loader used to load (or reload) this contract.
     */
    loadContract<T extends Contract>(address: string, loader: ContractLoader<T>): Promise<T>;
    /**
     * Retreives a contract from the registry. Must exist otherwise this will throw.
     * @param address The address to load from the registry.
     * @returns The contract requested
     */
    getContract<T extends Contract>(address: string): T;
    /**
     * Changes the RPC url we're connected to, and reloads the ethers contract references.
     */
    setRpcUrl(rpcUrl: string): Promise<void>;
    /**
     * Changes the ethereum account on behalf of which this {@link EthConnection} sends transactions. Reloads
     * the contracts.
     */
    setAccount(skey: string): Promise<void>;
    private refreshBalance;
    /**
     * Loads gas prices from xDai.
     */
    private refreshGasPrices;
    /**
     * Gets a copy of the latest gas prices.
     */
    getAutoGasPrices(): GasPrices;
    /**
     * Get the gas price, measured in Gwei, that we should send given the current prices for
     * transaction speeds, and given the user's gas price setting.
     */
    getAutoGasPriceGwei(gasPrices: GasPrices, gasPriceSetting: AutoGasSetting | string): number;
    getRpcEndpoint(): string;
    hasSigner(): boolean;
    subscribeToContractEvents(contract: Contract, handlers: Partial<Record<string, any>>, eventFilter: EventFilter): void;
    /**
     * Whenever we become aware of the fact that there have been one or more new blocks mined on the
     * blockchain, we need to update the internal game state of the game to reflect everything that
     * has happnened in those blocks. The way we find out what happened during those blocks is by
     * filtering all the events that have occured in those blocks to those that represent the various
     * actions that can occur on the game.
     */
    private onNewBlock;
    /**
     * Downloads and processes all the events that have occurred in the given range of blocks.
     *
     * @param startBlock inclusive
     * @param endBlock inclusive
     */
    private processEvents;
    /**
     * Returns the address of the signer, if one was set.
     */
    getAddress(): EthAddress | undefined;
    /**
     * Returns the private key of the signer, if one was set.
     */
    getPrivateKey(): string | undefined;
    /**
     * Gets the signer's nonce, or `0`.
     */
    getNonce(): Promise<number>;
    /**
     * Signs a string, or throws an error if a signer has not been set.
     */
    signMessage(message: string): Promise<string>;
    /**
     * Returns a version of this message signed by the account that this {@code EthConnectio} is
     * logged in as.
     */
    signMessageObject<T>(obj: T): Promise<SignedMessage<T>>;
    /**
     * Gets the balance of the given address (player or contract) measured in Wei. Wei is the base
     * unit in which amounts of Ether and xDai are measured.
     *
     * @see https://ethdocs.org/en/latest/ether.html#denominations
     */
    loadBalance(address: EthAddress): Promise<BigNumber>;
    /**
     * Sends a transaction on behalf of the account that can be set via
     * {@link EthConnection.setAccount}. Throws an error if no account was set.
     */
    sendTransaction(request: providers.TransactionRequest): Promise<providers.TransactionResponse>;
    /**
     * Gets the provider this {@link EthConnection} is currently using. Don't store a reference to
     * this (unless you're writing plugins), as the provider can change.
     */
    getProvider(): providers.JsonRpcProvider;
    /**
     * Gets the wallet, which represents the account that this {@link EthConnection} sends
     * transactions on behalf of.
     */
    getSigner(): Wallet | undefined;
    /**
     * Gets the current balance of the burner wallet this {@link EthConnection} is in charge of.
     */
    getMyBalance(): BigNumber | undefined;
    getCurrentBlockNumber(): number;
    /**
     * Returns a promise that resolves when the transaction with the given hash is confirmed, and
     * rejects if the transaction reverts or if there's a network error.
     */
    waitForTransaction(txHash: string): Promise<providers.TransactionReceipt>;
    /**
     * For collecting diagnostics.
     */
    setDiagnosticUpdater(diagnosticUpdater?: DiagnosticUpdater): void;
    /**
     * Cleans up any important handles.
     */
    destroy(): void;
    private stopPolling;
    /**
     * Kicks off an interval that regularly reloads the gas prices from xDai.
     */
    private startPolling;
}
export declare function createEthConnection(rpcUrl: string): Promise<EthConnection>;
