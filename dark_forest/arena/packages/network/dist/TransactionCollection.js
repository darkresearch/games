"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxCollection = void 0;
/**
 * Default implementation of a transaction collection - provides a simple api for adding, removing,
 * and querying by type of transaction.
 */
class TxCollection {
    constructor() {
        this.transactions = [];
    }
    /**
     * Internally records the given transaction.
     */
    addTransaction(tx) {
        this.transactions.push(tx);
    }
    /**
     * Removes the internal record of the given transaction.
     */
    removeTransaction(tx) {
        this.transactions.splice(this.transactions.findIndex((tx2) => tx === tx2), 1);
    }
    /**
     * Gets all transactions which are filtered to a particular type given a predicate.
     */
    getTransactions(transactionPredicate) {
        return this.transactions.filter(transactionPredicate);
    }
    /**
     * Returns whether or not there is at least one transaction which is filtered to by the given
     * predicate.
     */
    hasTransaction(transactionPredicate) {
        return this.transactions.filter(transactionPredicate).length !== 0;
    }
}
exports.TxCollection = TxCollection;
//# sourceMappingURL=TransactionCollection.js.map