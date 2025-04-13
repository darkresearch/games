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
exports.MAX_PERLIN_VALUE = exports.Fraction = exports.seededRandom = exports.fakeHash = exports.modPBigIntNative = exports.modPBigInt = exports.getRandomGradientAt = exports.rand = exports.perlin = exports.mimcSponge = exports.mimcHash = void 0;
/**
 * This package contains MiMC hashing utilities for use with Dark Forest.
 * The MiMC algorithm is used for both finding planet hashes and calculating
 * the perlin in-game. Among other things, these values are often needed for
 * generating Snarks.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @darkforest_eth/hashing
 * ```
 * ```bash
 * yarn add @darkforest_eth/hashing
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as hashing from 'http://cdn.skypack.dev/@darkforest_eth/hashing'
 * ```
 *
 * @packageDocumentation
 */
const fakeHash_1 = require("./fakeHash");
Object.defineProperty(exports, "fakeHash", { enumerable: true, get: function () { return fakeHash_1.fakeHash; } });
Object.defineProperty(exports, "seededRandom", { enumerable: true, get: function () { return fakeHash_1.seededRandom; } });
const bigFraction_1 = require("./fractions/bigFraction");
Object.defineProperty(exports, "Fraction", { enumerable: true, get: function () { return bigFraction_1.Fraction; } });
const mimc_1 = __importStar(require("./mimc"));
exports.mimcHash = mimc_1.default;
Object.defineProperty(exports, "mimcSponge", { enumerable: true, get: function () { return mimc_1.mimcSponge; } });
Object.defineProperty(exports, "modPBigInt", { enumerable: true, get: function () { return mimc_1.modPBigInt; } });
Object.defineProperty(exports, "modPBigIntNative", { enumerable: true, get: function () { return mimc_1.modPBigIntNative; } });
const perlin_1 = require("./perlin");
Object.defineProperty(exports, "getRandomGradientAt", { enumerable: true, get: function () { return perlin_1.getRandomGradientAt; } });
Object.defineProperty(exports, "MAX_PERLIN_VALUE", { enumerable: true, get: function () { return perlin_1.MAX_PERLIN_VALUE; } });
Object.defineProperty(exports, "perlin", { enumerable: true, get: function () { return perlin_1.perlin; } });
Object.defineProperty(exports, "rand", { enumerable: true, get: function () { return perlin_1.rand; } });
//# sourceMappingURL=index.js.map