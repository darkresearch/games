"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPurchase = exports.ethToWei = exports.weiToEth = exports.weiToGwei = exports.gweiToWei = exports.verifySignature = exports.assertProperlySigned = exports.makeProvider = exports.createContract = exports.waitForTransaction = exports.aggregateBulkGetter = exports.neverResolves = exports.getGasSettingGwei = exports.callWithRetry = void 0;
const constants_1 = require("@darkforest_eth/constants");
const serde_1 = require("@darkforest_eth/serde");
const types_1 = require("@darkforest_eth/types");
const ethers_1 = require("ethers");
const json_stable_stringify_1 = __importDefault(require("json-stable-stringify"));
const p_retry_1 = __importDefault(require("p-retry"));
const p_timeout_1 = __importDefault(require("p-timeout"));
/**
 * Calls the given function, retrying it if there is an error.
 *
 * @todo Get rid of this, and make use of {@link ContractCaller}.
 */
const callWithRetry = async (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
fn, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
args = [], onError, maxRetries = constants_1.DEFAULT_MAX_CALL_RETRIES, retryInterval = 1000) => {
    return (0, p_retry_1.default)(() => fn(...args), {
        // TODO: Should we set maxRetryTime?
        retries: maxRetries,
        minTimeout: retryInterval,
        maxTimeout: 60000,
        onFailedAttempt(e) {
            console.error(`error: ${e}`);
            console.log(`retrying (${e.attemptNumber + 1}/${maxRetries})...`);
            if (onError) {
                try {
                    onError(e.attemptNumber, e);
                }
                catch (e) {
                    console.log(`failed executing callWithRetry error handler`, e);
                }
            }
        },
    });
};
exports.callWithRetry = callWithRetry;
/**
 * Given the user's auto gas setting, and the current set of gas prices on the network, returns the
 * preferred gas price. If an invalid {@link AutoGasSetting} is provided, then returns undefined.
 */
function getGasSettingGwei(setting, gasPrices) {
    switch (setting) {
        case types_1.AutoGasSetting.Slow:
            return gasPrices.slow;
        case types_1.AutoGasSetting.Average:
            return gasPrices.average;
        case types_1.AutoGasSetting.Fast:
            return gasPrices.fast;
        default:
            return undefined;
    }
}
exports.getGasSettingGwei = getGasSettingGwei;
/**
 * A function that just never resolves.s
 */
function neverResolves() {
    return new Promise(() => { });
}
exports.neverResolves = neverResolves;
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
const aggregateBulkGetter = async (total, querySize, getterFn, 
// the parameter to this function is a value between 0 and 1. We guarantee at least one call to
// `onProgress` if you provide it. The guaranteed call is the one at the end, where the value is 1.
onProgress, offset = 0) => {
    const promises = [];
    let loadedSoFar = 0;
    for (let page = 0; page * querySize + offset < total; page += 1) {
        const start = page * querySize + offset;
        const end = Math.min((page + 1) * querySize + offset, total);
        const loadedThisBatch = end - start;
        promises.push(new Promise(async (resolve) => {
            let res = [];
            while (res.length === 0) {
                res = await getterFn(start, end);
                loadedSoFar += loadedThisBatch;
                onProgress && onProgress(loadedSoFar / total);
            }
            resolve(res);
        }));
    }
    const unflattenedResults = await Promise.all(promises);
    onProgress && onProgress(1);
    return unflattenedResults.flat();
};
exports.aggregateBulkGetter = aggregateBulkGetter;
/**
 * Given a transaction hash and a JsonRpcProvider, waits for the given transaction to complete.
 */
function waitForTransaction(provider, txHash) {
    return (0, p_retry_1.default)(async (tries) => {
        console.log(`[wait-tx] WAITING ON tx hash: ${txHash} tries ${tries}`);
        try {
            const receipt = await (0, p_timeout_1.default)(provider.getTransactionReceipt(txHash), 30 * 1000);
            if (receipt) {
                console.log(`[wait-tx] FINISHED tx hash: ${txHash} tries ${tries}`);
                return receipt;
            }
            else {
                return Promise.reject(new Error("couldn't get receipt"));
            }
        }
        catch (e) {
            console.error(`[wait-tx] TIMED OUT tx hash: ${txHash} tries ${tries} error:`, e);
            return Promise.reject(e);
        }
    }, {
        // TODO: Should we set maxRetryTime?
        retries: constants_1.DEFAULT_MAX_CALL_RETRIES,
        minTimeout: 2000,
        maxTimeout: 60000,
        factor: 1.5,
        onFailedAttempt(e) {
            console.log(`[wait-tx] SLEEPING tx hash: ${txHash} tries ${e.attemptNumber} sleeping...`);
        },
    });
}
exports.waitForTransaction = waitForTransaction;
/**
 * @param contractAddress the address of the contract you want to connect to
 * @param contractABI a javacript object representing the ABI
 */
function createContract(contractAddress, contractABI, provider, signer) {
    return new ethers_1.Contract(contractAddress, contractABI, signer !== null && signer !== void 0 ? signer : provider);
}
exports.createContract = createContract;
/**
 * Creates a new {@link JsonRpcProvider}, and makes sure that it's connected to xDai if we're in
 * production.
 */
function makeProvider(rpcUrl) {
    let provider;
    if (rpcUrl.startsWith('wss://')) {
        provider = new ethers_1.providers.WebSocketProvider(rpcUrl);
    }
    else {
        provider = new ethers_1.providers.StaticJsonRpcProvider(rpcUrl);
        provider.pollingInterval = 8000;
    }
    return provider;
}
exports.makeProvider = makeProvider;
/**
 * Ensures that the given message was properly signed.
 */
function assertProperlySigned(message) {
    const preSigned = (0, json_stable_stringify_1.default)(message.message);
    if (!verifySignature(preSigned, message.signature, message.sender)) {
        throw new Error(`failed to verify: ${message}`);
    }
}
exports.assertProperlySigned = assertProperlySigned;
/**
 * Returns whether or not the given message was signed by the given address.
 */
function verifySignature(message, signature, addr) {
    if (!addr) {
        return false;
    }
    return (0, serde_1.address)(ethers_1.utils.verifyMessage(message, signature)) === addr;
}
exports.verifySignature = verifySignature;
/**
 * Returns the given amount of gwei in wei as a big integer.
 */
function gweiToWei(gwei) {
    return ethers_1.utils.parseUnits(gwei + '', 'gwei');
}
exports.gweiToWei = gweiToWei;
/**
 * Returns the given amount of wei in gwei as a number.
 */
function weiToGwei(wei) {
    return parseFloat(ethers_1.utils.formatUnits(wei, 'gwei'));
}
exports.weiToGwei = weiToGwei;
/**
 * Returns the given amount of wei in gwei as a number.
 */
function weiToEth(wei) {
    return parseFloat(ethers_1.utils.formatEther(wei));
}
exports.weiToEth = weiToEth;
/**
 * Returns the given amount of eth in wei as a big integer.
 */
function ethToWei(eth) {
    return ethers_1.utils.parseEther(eth + '');
}
exports.ethToWei = ethToWei;
/**
 * Whether or not some value is being transferred in this transaction.
 */
function isPurchase(tx) {
    return tx !== undefined && tx.value !== undefined && tx.value > 0;
}
exports.isPurchase = isPurchase;
//# sourceMappingURL=Network.js.map