"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEthConnection = exports.EthConnection = void 0;
const constants_1 = require("@darkforest_eth/constants");
const events_1 = require("@darkforest_eth/events");
const serde_1 = require("@darkforest_eth/serde");
const ethers_1 = require("ethers");
const json_stable_stringify_1 = __importDefault(require("json-stable-stringify"));
const just_debounce_1 = __importDefault(require("just-debounce"));
const Network_1 = require("./Network");
const xDaiApi_1 = require("./xDaiApi");
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Responsible for
 * 1) loading the contracts
 * 2) connecting to the network
 */
class EthConnection {
    constructor(provider, blockNumber) {
        /**
         * Represents the gas price one would pay to achieve the corresponding transaction confirmation
         * speed.
         */
        this.gasPrices = constants_1.DEFAULT_GAS_PRICES;
        this.contracts = new Map();
        this.loaders = new Map();
        this.provider = provider;
        this.balance = ethers_1.BigNumber.from('0');
        this.blockNumber = blockNumber;
        this.blockNumber$ = (0, events_1.monomitter)(true);
        this.rpcChanged$ = (0, events_1.monomitter)(true);
        this.myBalance$ = (0, events_1.monomitter)(true);
        this.gasPrices$ = (0, events_1.monomitter)();
        this.rpcChanged$.publish(provider.connection.url);
        // this.startPolling();
    }
    async reloadContracts() {
        for (const [address, loader] of this.loaders) {
            // Was going to dedupe this with `this.loadContract` but there is no reason to set the loader again.
            const contract = await loader(address, this.provider, this.signer);
            this.contracts.set(address, contract);
        }
    }
    /**
     * Loads a contract into this {@link EthConnection}.
     *
     * @param address The contract address to register the contract against.
     * @param loader The loader used to load (or reload) this contract.
     */
    async loadContract(address, loader) {
        this.loaders.set(address, loader);
        const contract = await loader(address, this.provider, this.signer);
        this.contracts.set(address, contract);
        return contract;
    }
    /**
     * Retreives a contract from the registry. Must exist otherwise this will throw.
     * @param address The address to load from the registry.
     * @returns The contract requested
     */
    getContract(address) {
        const contract = this.contracts.get(address);
        if (!contract) {
            throw new Error(`Contract never loaded. Address: ${address}`);
        }
        return contract;
    }
    /**
     * Changes the RPC url we're connected to, and reloads the ethers contract references.
     */
    async setRpcUrl(rpcUrl) {
        const newProvider = await (0, Network_1.makeProvider)(rpcUrl);
        await this.reloadContracts();
        this.rpcChanged$.publish(newProvider.connection.url);
        this.provider = newProvider;
    }
    /**
     * Changes the ethereum account on behalf of which this {@link EthConnection} sends transactions. Reloads
     * the contracts.
     */
    async setAccount(skey) {
        this.signer = new ethers_1.Wallet(skey, this.provider);
        this.balance = await this.loadBalance((0, serde_1.address)(this.signer.address));
        await this.reloadContracts();
    }
    async refreshBalance() {
        if (this.signer) {
            const balance = await this.loadBalance((0, serde_1.address)(this.signer.address));
            this.balance = balance;
            this.myBalance$.publish(balance);
        }
    }
    /**
     * Loads gas prices from xDai.
     */
    async refreshGasPrices() {
        var _a;
        this.gasPrices = await (0, xDaiApi_1.getAutoGasPrices)();
        this.gasPrices$.publish(this.gasPrices);
        (_a = this.diagnosticsUpdater) === null || _a === void 0 ? void 0 : _a.updateDiagnostics((d) => (d.gasPrices = this.gasPrices));
    }
    /**
     * Gets a copy of the latest gas prices.
     */
    getAutoGasPrices() {
        return { ...this.gasPrices };
    }
    /**
     * Get the gas price, measured in Gwei, that we should send given the current prices for
     * transaction speeds, and given the user's gas price setting.
     */
    getAutoGasPriceGwei(gasPrices, gasPriceSetting // either auto or the gas price measured in gwei
    ) {
        // if the gas price setting represents an 'auto' choice, return that choice's current price
        const autoPrice = (0, Network_1.getGasSettingGwei)(gasPriceSetting, gasPrices);
        if (autoPrice !== undefined) {
            return autoPrice;
        }
        // if the gas price setting is not an auto choice, it is a string representing the user's
        // preferred gas price, measured in gwei.
        const parsedSetting = parseFloat(gasPriceSetting);
        if (!isNaN(parsedSetting)) {
            return parsedSetting;
        }
        // if the setting has become corrupted, just return an average gas price
        return gasPrices.average;
    }
    getRpcEndpoint() {
        return this.provider.connection.url;
    }
    hasSigner() {
        return !!this.signer;
    }
    subscribeToContractEvents(contract, 
    // map from contract event to function. using type 'any' here to satisfy typescript - each of
    // the functions has a different type signature.
    handlers, eventFilter) {
        const debouncedOnNewBlock = (0, just_debounce_1.default)(this.onNewBlock.bind(this), 1000, true, true);
        this.provider.on('block', async (latestBlockNumber) => {
            debouncedOnNewBlock(latestBlockNumber, contract, handlers, eventFilter);
        });
    }
    /**
     * Whenever we become aware of the fact that there have been one or more new blocks mined on the
     * blockchain, we need to update the internal game state of the game to reflect everything that
     * has happnened in those blocks. The way we find out what happened during those blocks is by
     * filtering all the events that have occured in those blocks to those that represent the various
     * actions that can occur on the game.
     */
    onNewBlock(latestBlockNumber, contract, handlers, eventFilter) {
        const previousBlockNumber = this.blockNumber;
        this.blockNumber = latestBlockNumber;
        this.blockNumber$.publish(latestBlockNumber);
        console.log(`processing events for ${latestBlockNumber - previousBlockNumber} blocks`);
        this.processEvents(Math.min(previousBlockNumber + 1, latestBlockNumber), latestBlockNumber, eventFilter, contract, handlers);
    }
    /**
     * Downloads and processes all the events that have occurred in the given range of blocks.
     *
     * @param startBlock inclusive
     * @param endBlock inclusive
     */
    async processEvents(startBlock, endBlock, eventFilter, contract, 
    // map from contract event name to the handler for that contract event
    handlers) {
        const logs = await this.provider.getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            ...eventFilter,
        });
        logs.forEach((log) => {
            const parsedData = contract.interface.parseLog(log);
            const handler = handlers[parsedData.name];
            if (handler !== undefined) {
                handler(...parsedData.args);
            }
        });
    }
    /**
     * Returns the address of the signer, if one was set.
     */
    getAddress() {
        if (!this.signer) {
            return undefined;
        }
        return (0, serde_1.address)(this.signer.address);
    }
    /**
     * Returns the private key of the signer, if one was set.
     */
    getPrivateKey() {
        if (!this.signer) {
            return undefined;
        }
        return this.signer.privateKey;
    }
    /**
     * Gets the signer's nonce, or `0`.
     */
    async getNonce() {
        if (!this.signer) {
            return 0;
        }
        return (0, Network_1.callWithRetry)(this.provider.getTransactionCount.bind(this.provider), [
            this.signer.address,
        ]);
    }
    /**
     * Signs a string, or throws an error if a signer has not been set.
     */
    async signMessage(message) {
        if (!this.signer) {
            throw new Error('no signer was set.');
        }
        return this.signer.signMessage(message);
    }
    /**
     * Returns a version of this message signed by the account that this {@code EthConnectio} is
     * logged in as.
     */
    async signMessageObject(obj) {
        if (!this.signer) {
            throw new Error('no signer was set.');
        }
        const stringified = (0, json_stable_stringify_1.default)(obj);
        const signature = await this.signMessage(stringified);
        return {
            signature,
            sender: (0, serde_1.address)(this.signer.address),
            message: obj,
        };
    }
    /**
     * Gets the balance of the given address (player or contract) measured in Wei. Wei is the base
     * unit in which amounts of Ether and xDai are measured.
     *
     * @see https://ethdocs.org/en/latest/ether.html#denominations
     */
    async loadBalance(address) {
        return await (0, Network_1.callWithRetry)(this.provider.getBalance.bind(this.provider), [address]);
    }
    /**
     * Sends a transaction on behalf of the account that can be set via
     * {@link EthConnection.setAccount}. Throws an error if no account was set.
     */
    sendTransaction(request) {
        if (!this.signer)
            throw new Error(`no signer`);
        return this.signer.sendTransaction(request);
    }
    /**
     * Gets the provider this {@link EthConnection} is currently using. Don't store a reference to
     * this (unless you're writing plugins), as the provider can change.
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Gets the wallet, which represents the account that this {@link EthConnection} sends
     * transactions on behalf of.
     */
    getSigner() {
        return this.signer;
    }
    /**
     * Gets the current balance of the burner wallet this {@link EthConnection} is in charge of.
     */
    getMyBalance() {
        return this.balance;
    }
    getCurrentBlockNumber() {
        return this.blockNumber;
    }
    /**
     * Returns a promise that resolves when the transaction with the given hash is confirmed, and
     * rejects if the transaction reverts or if there's a network error.
     */
    waitForTransaction(txHash) {
        return (0, Network_1.waitForTransaction)(this.provider, txHash);
    }
    /**
     * For collecting diagnostics.
     */
    setDiagnosticUpdater(diagnosticUpdater) {
        this.diagnosticsUpdater = diagnosticUpdater;
        this.rpcChanged$.subscribe(() => {
            diagnosticUpdater === null || diagnosticUpdater === void 0 ? void 0 : diagnosticUpdater.updateDiagnostics((diagnostics) => (diagnostics.rpcUrl = this.getRpcEndpoint()));
        });
        this.gasPrices$.subscribe((gasPrices) => {
            diagnosticUpdater === null || diagnosticUpdater === void 0 ? void 0 : diagnosticUpdater.updateDiagnostics((diagnostics) => (diagnostics.gasPrices = gasPrices));
        });
    }
    /**
     * Cleans up any important handles.
     */
    destroy() {
        this.stopPolling();
    }
    stopPolling() {
        if (this.gasPricesInterval) {
            clearInterval(this.gasPricesInterval);
        }
        if (this.balanceInterval) {
            clearInterval(this.balanceInterval);
        }
    }
    /**
     * Kicks off an interval that regularly reloads the gas prices from xDai.
     */
    startPolling() {
        this.refreshGasPrices();
        this.gasPricesInterval = setInterval(this.refreshGasPrices.bind(this), constants_1.GAS_PRICES_INTERVAL_MS);
        this.refreshBalance();
        this.balanceInterval = setInterval(this.refreshBalance.bind(this), 1000 * 10);
    }
}
exports.EthConnection = EthConnection;
async function createEthConnection(rpcUrl) {
    const provider = await (0, Network_1.makeProvider)(rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    return new EthConnection(provider, blockNumber);
}
exports.createEthConnection = createEthConnection;
//# sourceMappingURL=EthConnection.js.map