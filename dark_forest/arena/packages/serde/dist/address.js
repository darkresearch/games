"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToInt = exports.address = exports.isAddress = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const ethers_1 = require("ethers");
/**
 * Converts a string to an `EthAddress`: a 0x-prefixed all lowercase hex string
 * of 40 hex characters. An object of the `EthAddress` type should only ever be
 * initialized through this constructor-like method. Throws if the provided
 * string cannot be parsed as an Ethereum address.
 *
 * @param str An address-like `string`
 */
function isAddress(str) {
    return ethers_1.ethers.utils.isAddress(str);
}
exports.isAddress = isAddress;
function address(str) {
    let ret = str.toLowerCase();
    if (ret.slice(0, 2) === '0x') {
        ret = ret.slice(2);
    }
    for (const c of ret) {
        if ('0123456789abcdef'.indexOf(c) === -1)
            throw new Error('not a valid address');
    }
    if (ret.length !== 40)
        throw new Error('not a valid address');
    return `0x${ret}`;
}
exports.address = address;
function hashToInt(hash) {
    const seed = (0, big_integer_1.default)(hash, 16).and(0xffffffffff).toString(16);
    return parseInt('0x' + seed);
}
exports.hashToInt = hashToInt;
//# sourceMappingURL=address.js.map