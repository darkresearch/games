"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractCaller = void 0;
const constants_1 = require("@darkforest_eth/constants");
const p_retry_1 = __importStar(require("p-retry"));
const ThrottledConcurrentQueue_1 = require("./ThrottledConcurrentQueue");
/**
 * Instead of allowing the game to call `view` functions on the blockchain directly, all contract
 * calls should go through this class. Its purpose is to throttle the calls to a reasonable rate,
 * and to gracefully handle errors and retries
 */
class ContractCaller {
    constructor(queue, maxRetries) {
        /**
         * Queue which stores future contract calls.
         */
        this.queue = new ThrottledConcurrentQueue_1.ThrottledConcurrentQueue({
            maxInvocationsPerIntervalMs: 10,
            invocationIntervalMs: 200,
            maxConcurrency: 20,
        });
        /**
         * The maximum amount of times that we want the game to retry any individual call. Retries are
         * appended to the end of the queue, meaning they respect the throttling settings of this class.
         */
        this.maxRetries = constants_1.DEFAULT_MAX_CALL_RETRIES;
        if (queue)
            this.queue = queue;
        if (maxRetries)
            this.maxRetries = maxRetries;
    }
    /**
     * Submits a call to the call queue. Each call is retried a maximum of
     * {@link ContractCaller.DEFAULT_MAX_CALL_RETRIES} times. Returns a promise that resolves if the call was
     * successful, and rejects if it failed even after all the retries.
     */
    async makeCall(contractViewFunction, args = []) {
        var _a;
        const result = (0, p_retry_1.default)(async () => {
            var _a, _b;
            const callPromise = this.queue.add(() => {
                var _a;
                (_a = this.diagnosticsUpdater) === null || _a === void 0 ? void 0 : _a.updateDiagnostics((d) => {
                    d.totalCalls++;
                });
                return contractViewFunction(...args);
            });
            (_a = this.diagnosticsUpdater) === null || _a === void 0 ? void 0 : _a.updateDiagnostics((d) => {
                d.callsInQueue = this.queue.size();
            });
            try {
                const callResult = await callPromise;
                (_b = this.diagnosticsUpdater) === null || _b === void 0 ? void 0 : _b.updateDiagnostics((d) => {
                    d.callsInQueue = this.queue.size();
                });
                return callResult;
            }
            catch (err) {
                if (err.code === 'CALL_EXCEPTION') {
                    throw new p_retry_1.AbortError('Could not call function on given contract');
                }
                else {
                    console.warn('retrying after err:', err);
                    throw err;
                }
            }
        }, { retries: this.maxRetries });
        (_a = this.diagnosticsUpdater) === null || _a === void 0 ? void 0 : _a.updateDiagnostics((d) => {
            d.totalCalls++;
        });
        return result;
    }
    /**
     * Sets the diagnostics updater to the one you provide. If you don't set this, everything apart
     * from diagnostics continues to function.
     */
    setDiagnosticUpdater(diagnosticUpdater) {
        this.diagnosticsUpdater = diagnosticUpdater;
    }
}
exports.ContractCaller = ContractCaller;
//# sourceMappingURL=ContractCaller.js.map