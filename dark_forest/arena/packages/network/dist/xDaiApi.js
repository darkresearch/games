"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutoGasPrices = void 0;
const constants_1 = require("@darkforest_eth/constants");
/**
 * Gets the current gas prices from xDai's price oracle. If the oracle is broken, return some sane
 * defaults.
 */
async function getAutoGasPrices() {
    try {
        const res = await fetch(constants_1.GAS_PRICE_API, {
            method: 'GET',
        });
        const prices = (await res.json());
        cleanGasPrices(prices);
        return prices;
    }
    catch (e) {
        return constants_1.DEFAULT_GAS_PRICES;
    }
}
exports.getAutoGasPrices = getAutoGasPrices;
/**
 * In case xDai gives us a malformed response, clean it up with some default gas prices.
 */
function cleanGasPrices(gasPrices) {
    if (typeof gasPrices.fast !== 'number') {
        gasPrices.fast = constants_1.DEFAULT_GAS_PRICES.fast;
    }
    if (typeof gasPrices.average !== 'number') {
        gasPrices.average = constants_1.DEFAULT_GAS_PRICES.average;
    }
    if (typeof gasPrices.slow !== 'number') {
        gasPrices.slow = constants_1.DEFAULT_GAS_PRICES.slow;
    }
    gasPrices.fast = Math.max(1, Math.min(constants_1.MAX_AUTO_GAS_PRICE_GWEI, gasPrices.fast));
    gasPrices.average = Math.max(1, Math.min(constants_1.MAX_AUTO_GAS_PRICE_GWEI, gasPrices.average));
    gasPrices.slow = Math.max(1, Math.min(constants_1.MAX_AUTO_GAS_PRICE_GWEI, gasPrices.slow));
}
//# sourceMappingURL=xDaiApi.js.map