import { Transaction, TransactionCollection, TxIntent } from '@darkforest_eth/types';
/**
 * Default implementation of a transaction collection - provides a simple api for adding, removing,
 * and querying by type of transaction.
 */
export declare class TxCollection implements TransactionCollection {
    private transactions;
    /**
     * Internally records the given transaction.
     */
    addTransaction(tx: Transaction): void;
    /**
     * Removes the internal record of the given transaction.
     */
    removeTransaction(tx: Transaction): void;
    /**
     * Gets all transactions which are filtered to a particular type given a predicate.
     */
    getTransactions<T extends TxIntent>(transactionPredicate: (u: Transaction) => u is Transaction<T>): Transaction<T>[];
    /**
     * Returns whether or not there is at least one transaction which is filtered to by the given
     * predicate.
     */
    hasTransaction<T extends TxIntent>(transactionPredicate: (u: Transaction) => u is Transaction<T>): boolean;
}
