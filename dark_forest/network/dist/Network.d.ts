import { AutoGasSetting, EthAddress, GasPrices, SignedMessage } from '@darkforest_eth/types';
import { BigNumber, Contract, ContractInterface, providers, Wallet } from 'ethers';
export declare type RetryErrorHandler = (i: number, e: Error) => void;
/**
 * Calls the given function, retrying it if there is an error.
 *
 * @todo Get rid of this, and make use of {@link ContractCaller}.
 */
export declare const callWithRetry: <T>(fn: (...args: any[]) => Promise<T>, args?: any[], onError?: RetryErrorHandler | undefined, maxRetries?: 12, retryInterval?: number) => Promise<T>;
/**
 * Given the user's auto gas setting, and the current set of gas prices on the network, returns the
 * preferred gas price. If an invalid {@link AutoGasSetting} is provided, then returns undefined.
 */
export declare function getGasSettingGwei(setting: AutoGasSetting, gasPrices: GasPrices): number | undefined;
/**
 * A function that just never resolves.s
 */
export declare function neverResolves(): Promise<void>;
/**
 * A useful utility function that breaks up the proverbial number line (defined by {@code total} and
 * {@code querySize}), and calls {@code getterFn} for each of the sections on the number line.
 *
 * @param total the total amount of of items to get
 * @param querySize the chunk size
 * @param getterFn a function that fetches something, given a start index and end index
 * @param onProgress whenever a chunk is loaded, this function is called with the fraction of
 * individual items that have been loaded so far.
 * @param offset the index to start fetching, can be used to skip previously fetched elements.
 * @returns a list of each of the individual items that were loaded.
 */
export declare const aggregateBulkGetter: <T>(total: number, querySize: number, getterFn: (startIdx: number, endIdx: number) => Promise<T[]>, onProgress?: ((fractionCompleted: number) => void) | undefined, offset?: number) => Promise<T[]>;
/**
 * Given a transaction hash and a JsonRpcProvider, waits for the given transaction to complete.
 */
export declare function waitForTransaction(provider: providers.JsonRpcProvider, txHash: string): Promise<providers.TransactionReceipt>;
/**
 * @param contractAddress the address of the contract you want to connect to
 * @param contractABI a javacript object representing the ABI
 */
export declare function createContract<C extends Contract>(contractAddress: string, contractABI: ContractInterface, provider: providers.JsonRpcProvider, signer?: Wallet): C;
/**
 * Creates a new {@link JsonRpcProvider}, and makes sure that it's connected to xDai if we're in
 * production.
 */
export declare function makeProvider(rpcUrl: string): providers.JsonRpcProvider;
/**
 * Ensures that the given message was properly signed.
 */
export declare function assertProperlySigned(message: SignedMessage<unknown>): void;
/**
 * Returns whether or not the given message was signed by the given address.
 */
export declare function verifySignature(message: string, signature: string, addr: EthAddress | undefined): boolean;
/**
 * Returns the given amount of gwei in wei as a big integer.
 */
export declare function gweiToWei(gwei: number): BigNumber;
/**
 * Returns the given amount of wei in gwei as a number.
 */
export declare function weiToGwei(wei: BigNumber): number;
/**
 * Returns the given amount of wei in gwei as a number.
 */
export declare function weiToEth(wei: BigNumber): number;
/**
 * Returns the given amount of eth in wei as a big integer.
 */
export declare function ethToWei(eth: number): BigNumber;
/**
 * Whether or not some value is being transferred in this transaction.
 */
export declare function isPurchase(tx?: providers.TransactionRequest): boolean;
