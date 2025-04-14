import { AutoGasSetting, DiagnosticUpdater, PersistedTransaction, Transaction, TransactionId, TxIntent } from '@darkforest_eth/types';
import { providers } from 'ethers';
import { EthConnection } from './EthConnection';
import { ConcurrentQueueConfiguration } from './ThrottledConcurrentQueue';
/**
 * Returns either a string that represents the gas price we should use by default for transactions,
 * or a string that represents the fact that we should be using one of the automatic gas prices.
 */
export declare type GasPriceSettingProvider = (transactionRequest: Transaction) => AutoGasSetting | string;
/**
 * {@link TxExecutor} calls this before queueing a function to determine whether or not that
 * function should be queued. If this function rejects, a transaction is not queued.
 */
export declare type BeforeQueued = (id: TransactionId, intent: TxIntent, overrides?: providers.TransactionRequest) => Promise<void>;
/**
 * {@link TxExecutor} calls this before executing a function to determine whether or not that
 * function should execute. If this function rejects, the transaction is cancelled.
 */
export declare type BeforeTransaction = (transactionRequest: Transaction) => Promise<void>;
/**
 * {@link TxExecutor} calls this after executing a transaction.
 */
export declare type AfterTransaction = (transactionRequest: Transaction, performanceMetrics: unknown) => Promise<void>;
export declare class TxExecutor {
    /**
     * A transaction is considered to have errored if haven't successfully submitted to mempool within
     * this amount of time.
     */
    private static readonly TX_SUBMIT_TIMEOUT;
    /**
     * Our interface to the blockchain.
     */
    private readonly ethConnection;
    /**
     * Communicates to the {@link TxExecutor} the gas price we should be paying for each transaction,
     * if there is not a manual gas price specified for that transaction.
     */
    private readonly gasSettingProvider;
    /**
     * If present, called before any transaction is queued, to give the user of {@link TxExecutor} the
     * opportunity to cancel the event by rejecting. Useful for interstitials.
     */
    private readonly beforeQueued?;
    /**
     * If present, called before every transaction, to give the user of {@link TxExecutor} the
     * opportunity to cancel the event by throwing an exception. Useful for interstitials.
     */
    private readonly beforeTransaction?;
    /**
     * If present, called after every transaction with the transaction info as well as its performance
     * metrics.
     */
    private readonly afterTransaction?;
    /**
     * Task queue which executes transactions in a controlled manner.
     */
    private readonly queue;
    /**
     * We record the last transaction timestamp so that we know when it's a good time to refresh the
     * nonce.
     */
    private lastTransactionTimestamp;
    /**
     * All Ethereum transactions have a nonce. The nonce should strictly increase with each
     * transaction.
     */
    private nonce;
    /**
     * Increments every time a new transaction is created. This is separate from the nonce because
     * it is used solely for ordering transactions client-side.
     */
    private idSequence;
    /**
     * Allows us to record some diagnostics that appear in the DiagnosticsPane of the Dark Forest client.
     */
    private diagnosticsUpdater?;
    /**
     * Unless overridden, these are the default transaction options each blockchain transaction will
     * be sent with.
     */
    private defaultTxOptions;
    /**
     * Mutex that ensures only one transaction is modifying the nonce
     * at a time.
     */
    private nonceMutex;
    /**
     * Turning this on refreshes the nonce if there has not been
     * a transaction after {@link NONCE_STALE_AFTER_MS}. This is so that
     * we can get the most up to date nonce even if other
     * wallets/applications are sending transactions as the same
     * address.
     */
    private supportMultipleWallets;
    /**
     * If {@link supportMultipleWallets} is true, refresh the nonce if a
     * transaction has not been sent in this amount of time.
     */
    private static readonly NONCE_STALE_AFTER_MS;
    constructor(ethConnection: EthConnection, gasSettingProvider: GasPriceSettingProvider, beforeQueued?: BeforeQueued, beforeTransaction?: BeforeTransaction, afterTransaction?: AfterTransaction, queueConfiguration?: ConcurrentQueueConfiguration, supportMultipleWallets?: boolean);
    /**
     * Given a transaction that has been persisted (and therefore submitted), we return a transaction
     * whose confirmationPromise resolves once the transaction was verified to have been confirmed.
     * Useful for plugging these persisted transactions into our transaction system.
     */
    waitForTransaction<T extends TxIntent>(ser: PersistedTransaction<T>): Transaction<T>;
    /**
     * Schedules this transaction for execution.
     */
    queueTransaction<T extends TxIntent>(intent: T, overrides?: providers.TransactionRequest): Promise<Transaction<T>>;
    dequeueTransction(tx: Transaction): void;
    prioritizeTransaction(tx: Transaction): void;
    /**
     * Returns the current nonce and increments it in memory for the next transaction.
     * If nonce is undefined, or there has been a big gap between transactions,
     * refresh the nonce from the blockchain. This only replaces the nonce if the
     * blockchain nonce is found to be higher than the local calculation.
     * The stale timer is to support multiple wallets/applications interacting
     * with the game at the same time.
     */
    private getNonce;
    /**
     * Reset nonce.
     * This will trigger a refresh from the blockchain the next time
     * execution starts.
     */
    private resetNonce;
    /**
     * Return current counter and increment.
     */
    private nextId;
    /**
     * Executes the given queued transaction. This is a field rather than a method declaration on
     * purpose for `this` purposes.
     */
    private execute;
    setDiagnosticUpdater(diagnosticUpdater?: DiagnosticUpdater): void;
}
