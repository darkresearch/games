"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationIdToDecStr = exports.locationIdFromEthersBN = exports.locationIdFromBigInt = exports.locationIdFromDecStr = exports.locationIdFromHexStr = void 0;
const constants_1 = require("@darkforest_eth/constants");
const big_integer_1 = __importDefault(require("big-integer"));
/**
 * Converts a possibly 0x-prefixed string of hex digits to a `LocationId`: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). LocationIDs should only be instantiated through
 * `locationIdFromHexStr`, `locationIdFromDecStr`, `locationIdFromBigInt`, and
 * `locationIdFromEthersBN`.
 *
 * @param location A possibly 0x-prefixed `string` of hex digits representing a
 * location ID.
 */
function locationIdFromHexStr(location) {
    const locationBI = (0, big_integer_1.default)(location, 16);
    if (locationBI.geq(constants_1.LOCATION_ID_UB))
        throw new Error('not a valid location');
    let ret = locationBI.toString(16);
    while (ret.length < 64)
        ret = '0' + ret;
    return ret;
}
exports.locationIdFromHexStr = locationIdFromHexStr;
/**
 * Converts a string representing a decimal number into a LocationID: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). LocationIDs should only be instantiated through
 * `locationIdFromHexStr`, `locationIdFromDecStr`, `locationIdFromBigInt`, and
 * `locationIdFromEthersBN`.
 *
 * @param location `string` of decimal digits, the base 10 representation of a
 * location ID.
 */
function locationIdFromDecStr(location) {
    const locationBI = (0, big_integer_1.default)(location);
    if (locationBI.geq(constants_1.LOCATION_ID_UB))
        throw new Error('not a valid location');
    let ret = locationBI.toString(16);
    while (ret.length < 64)
        ret = '0' + ret;
    return ret;
}
exports.locationIdFromDecStr = locationIdFromDecStr;
/**
 * Converts a BigInteger representation of location ID into a LocationID: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded). LocationIDs should only be instantiated through
 * `locationIdFromHexStr`, `locationIdFromDecStr`, `locationIdFromBigInt`, and
 * `locationIdFromEthersBN`.
 *
 * @param location `BigInteger` representation of a location ID.
 */
function locationIdFromBigInt(location) {
    const locationBI = (0, big_integer_1.default)(location);
    if (locationBI.geq(constants_1.LOCATION_ID_UB))
        throw new Error('not a valid location');
    let ret = locationBI.toString(16);
    while (ret.length < 64)
        ret = '0' + ret;
    return ret;
}
exports.locationIdFromBigInt = locationIdFromBigInt;
/**
 * Converts an ethers.js BigNumber (type aliased here as `EthersBN`)
 * representation of a location ID into a LocationID: a non-0x-prefixed all
 * lowercase hex string of exactly 64 hex characters (0-padded). LocationIDs
 * should only be instantiated through `locationIdFromHexStr`,
 * `locationIdFromDecStr`, `locationIdFromBigInt`, and `locationIdFromEthersBN`.
 *
 * @param location ethers.js `BigNumber` representation of a locationID.
 */
function locationIdFromEthersBN(location) {
    return locationIdFromDecStr(location.toString());
}
exports.locationIdFromEthersBN = locationIdFromEthersBN;
/**
 * Converts a LocationID to a decimal string with the same numerical value; can
 * be used if you need to pass an artifact ID into a web3 call.
 *
 * @param locationId LocationID to convert into a `string` of decimal digits
 */
function locationIdToDecStr(locationId) {
    return (0, big_integer_1.default)(locationId, 16).toString(10);
}
exports.locationIdToDecStr = locationIdToDecStr;
//# sourceMappingURL=location.js.map