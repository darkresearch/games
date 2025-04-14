"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxExecutor = void 0;
const async_mutex_1 = require("async-mutex");
const p_defer_1 = __importDefault(require("p-defer"));
const p_timeout_1 = __importDefault(require("p-timeout"));
const Network_1 = require("./Network");
const ThrottledConcurrentQueue_1 = require("./ThrottledConcurrentQueue");
class TxExecutor {
    constructor(ethConnection, gasSettingProvider, beforeQueued, beforeTransaction, afterTransaction, queueConfiguration, supportMultipleWallets = true) {
        /**
         * Increments every time a new transaction is created. This is separate from the nonce because
         * it is used solely for ordering transactions client-side.
         */
        this.idSequence = 0;
        /**
         * Unless overridden, these are the default transaction options each blockchain transaction will
         * be sent with.
         */
        this.defaultTxOptions = {
            gasLimit: 2000000,
        };
        /**
         * Executes the given queued transaction. This is a field rather than a method declaration on
         * purpose for `this` purposes.
         */
        this.execute = async (tx) => {
            var _a;
            let time_called = undefined;
            let error = undefined;
            let time_submitted = undefined;
            let time_confirmed = undefined;
            let time_errored = undefined;
            let tx_hash = undefined;
            const time_exec_called = Date.now();
            tx.state = 'Processing';
            if (this.beforeTransaction) {
                try {
                    await this.beforeTransaction(tx);
                }
                catch (e) {
                    console.error(e);
                }
            }
            const releaseMutex = await this.nonceMutex.acquire();
            try {
                const nonce = await this.getNonce();
                const requestWithDefaults = Object.assign(JSON.parse(JSON.stringify(this.defaultTxOptions)), tx.overrides);
                time_called = Date.now();
                const args = await tx.intent.args;
                const submitted = await (0, p_timeout_1.default)(tx.intent.contract[tx.intent.methodName](...args, {
                    ...requestWithDefaults,
                    nonce,
                }), TxExecutor.TX_SUBMIT_TIMEOUT, `tx request ${tx.id} failed to submit: timed out}`);
                releaseMutex();
                tx.state = 'Submit';
                tx.hash = submitted.hash;
                time_submitted = Date.now();
                tx.lastUpdatedAt = time_submitted;
                tx_hash = submitted.hash;
                this.lastTransactionTimestamp = time_submitted;
                tx.onTransactionResponse(submitted);
                const confirmed = await this.ethConnection.waitForTransaction(submitted.hash);
                if (confirmed.status !== 1) {
                    time_errored = Date.now();
                    tx.lastUpdatedAt = time_errored;
                    tx.state = 'Fail';
                    await this.resetNonce();
                    throw new Error('transaction reverted');
                }
                else {
                    tx.state = 'Confirm';
                    time_confirmed = Date.now();
                    tx.lastUpdatedAt = time_confirmed;
                    tx.onTransactionReceipt(confirmed);
                }
            }
            catch (e) {
                console.error(e);
                tx.state = 'Fail';
                error = e;
                // if the tx isnt submitted, the mutex hasnt been released.
                // so we can't call resetNonce because that function waits
                // for the mutex to be releaesd, so everything stops.
                // instead we set the nonce to undefined manually
                if (!time_submitted) {
                    this.nonce = undefined;
                    releaseMutex();
                    time_errored = Date.now();
                    tx.onSubmissionError(error);
                }
                else {
                    // Ran out of retries, set nonce to undefined to refresh it
                    if (!time_errored) {
                        await this.resetNonce();
                        time_errored = Date.now();
                    }
                    tx.lastUpdatedAt = time_errored;
                    tx.onReceiptError(error);
                }
            }
            finally {
                (_a = this.diagnosticsUpdater) === null || _a === void 0 ? void 0 : _a.updateDiagnostics((d) => {
                    d.totalTransactions++;
                });
            }
            const logEvent = {
                tx_to: tx.intent.contract.address,
                tx_type: tx.intent.methodName,
                auto_gas_price_setting: tx.autoGasPriceSetting,
                time_exec_called,
                tx_hash,
            };
            if (time_called && time_submitted) {
                logEvent.wait_submit = time_submitted - time_called;
                if (time_confirmed) {
                    logEvent.wait_confirm = time_confirmed - time_called;
                }
            }
            if (error && time_errored) {
                logEvent.error = error.message || JSON.stringify(error);
                logEvent.wait_error = time_errored - time_exec_called;
                try {
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    if (error.body) {
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        logEvent.parsed_error = String.fromCharCode.apply(null, error.body || []);
                    }
                }
                catch (e) { }
            }
            logEvent.rpc_endpoint = this.ethConnection.getRpcEndpoint();
            logEvent.user_address = this.ethConnection.getAddress();
            this.afterTransaction && this.afterTransaction(tx, logEvent);
        };
        this.queue = new ThrottledConcurrentQueue_1.ThrottledConcurrentQueue(queueConfiguration !== null && queueConfiguration !== void 0 ? queueConfiguration : {
            invocationIntervalMs: 200,
            maxInvocationsPerIntervalMs: 3,
            maxConcurrency: 10,
        });
        this.lastTransactionTimestamp = Date.now();
        this.ethConnection = ethConnection;
        this.gasSettingProvider = gasSettingProvider;
        this.beforeQueued = beforeQueued;
        this.beforeTransaction = beforeTransaction;
        this.afterTransaction = afterTransaction;
        this.nonceMutex = new async_mutex_1.Mutex();
        this.supportMultipleWallets = supportMultipleWallets;
    }
    /**
     * Given a transaction that has been persisted (and therefore submitted), we return a transaction
     * whose confirmationPromise resolves once the transaction was verified to have been confirmed.
     * Useful for plugging these persisted transactions into our transaction system.
     */
    waitForTransaction(ser) {
        const { promise: submittedPromise, reject: rejectTxResponse, resolve: txResponse, } = (0, p_defer_1.default)();
        const { promise: confirmedPromise, reject: rejectTxReceipt, resolve: txReceipt, } = (0, p_defer_1.default)();
        const tx = {
            id: this.nextId(),
            lastUpdatedAt: Date.now(),
            state: 'Init',
            intent: ser.intent,
            submittedPromise,
            confirmedPromise,
            onSubmissionError: rejectTxResponse,
            onReceiptError: rejectTxReceipt,
            onTransactionResponse: txResponse,
            onTransactionReceipt: txReceipt,
        };
        (0, Network_1.waitForTransaction)(this.ethConnection.getProvider(), ser.hash)
            .then((receipt) => {
            tx.onTransactionReceipt(receipt);
        })
            .catch((err) => {
            tx.onReceiptError(err);
        });
        return tx;
    }
    /**
     * Schedules this transaction for execution.
     */
    async queueTransaction(intent, overrides) {
        var _a, _b, _c;
        (_a = this.diagnosticsUpdater) === null || _a === void 0 ? void 0 : _a.updateDiagnostics((d) => {
            d.transactionsInQueue++;
        });
        const id = this.nextId();
        // The `beforeQueued` function is run before we do anything with the TX
        // And outside of the try/catch so anything it throws can be bubbled instead of
        // marking it as a reverted TX
        if (this.beforeQueued) {
            await this.beforeQueued(id, intent, overrides);
        }
        const { promise: submittedPromise, reject: rejectTxResponse, resolve: txResponse, } = (0, p_defer_1.default)();
        const { promise: confirmedPromise, reject: rejectTxReceipt, resolve: txReceipt, } = (0, p_defer_1.default)();
        const tx = {
            id,
            lastUpdatedAt: Date.now(),
            state: 'Init',
            intent,
            submittedPromise,
            confirmedPromise,
            overrides,
            onSubmissionError: rejectTxResponse,
            onReceiptError: rejectTxReceipt,
            onTransactionResponse: txResponse,
            onTransactionReceipt: txReceipt,
        };
        const autoGasPriceSetting = this.gasSettingProvider(tx);
        tx.autoGasPriceSetting = autoGasPriceSetting;
        if (((_b = tx.overrides) === null || _b === void 0 ? void 0 : _b.gasPrice) === undefined) {
            tx.overrides = (_c = tx.overrides) !== null && _c !== void 0 ? _c : {};
            tx.overrides.gasPrice = (0, Network_1.gweiToWei)(this.ethConnection.getAutoGasPriceGwei(this.ethConnection.getAutoGasPrices(), autoGasPriceSetting));
        }
        this.queue.add(() => {
            var _a;
            (_a = this.diagnosticsUpdater) === null || _a === void 0 ? void 0 : _a.updateDiagnostics((d) => {
                d.transactionsInQueue--;
            });
            return this.execute(tx);
        }, tx);
        return tx;
    }
    dequeueTransction(tx) {
        this.queue.remove((queuedTx) => (queuedTx === null || queuedTx === void 0 ? void 0 : queuedTx.id) === tx.id);
        tx.state = 'Cancel';
    }
    prioritizeTransaction(tx) {
        this.queue.prioritize((queuedTx) => (queuedTx === null || queuedTx === void 0 ? void 0 : queuedTx.id) === tx.id);
        tx.state = 'Prioritized';
    }
    /**
     * Returns the current nonce and increments it in memory for the next transaction.
     * If nonce is undefined, or there has been a big gap between transactions,
     * refresh the nonce from the blockchain. This only replaces the nonce if the
     * blockchain nonce is found to be higher than the local calculation.
     * The stale timer is to support multiple wallets/applications interacting
     * with the game at the same time.
     */
    async getNonce() {
        const shouldRefreshNonce = this.nonce === undefined ||
            (this.supportMultipleWallets &&
                Date.now() - this.lastTransactionTimestamp > TxExecutor.NONCE_STALE_AFTER_MS);
        if (shouldRefreshNonce) {
            const chainNonce = await this.ethConnection.getNonce();
            const localNonce = this.nonce || 0;
            console.log(`refreshing nonce, local is ${localNonce} and chain is ${chainNonce}`);
            this.nonce = Math.max(chainNonce, localNonce);
        }
        const nonce = this.nonce;
        if (this.nonce !== undefined)
            this.nonce++;
        return nonce;
    }
    /**
     * Reset nonce.
     * This will trigger a refresh from the blockchain the next time
     * execution starts.
     */
    async resetNonce() {
        return this.nonceMutex.runExclusive(() => (this.nonce = undefined));
    }
    /**
     * Return current counter and increment.
     */
    nextId() {
        return ++this.idSequence;
    }
    setDiagnosticUpdater(diagnosticUpdater) {
        this.diagnosticsUpdater = diagnosticUpdater;
    }
}
exports.TxExecutor = TxExecutor;
/**
 * A transaction is considered to have errored if haven't successfully submitted to mempool within
 * this amount of time.
 */
TxExecutor.TX_SUBMIT_TIMEOUT = 30000;
/**
 * If {@link supportMultipleWallets} is true, refresh the nonce if a
 * transaction has not been sent in this amount of time.
 */
TxExecutor.NONCE_STALE_AFTER_MS = 5000;
//# sourceMappingURL=TxExecutor.js.map