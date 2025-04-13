"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeRevealedCoords = void 0;
const constants_1 = require("@darkforest_eth/constants");
const big_integer_1 = __importDefault(require("big-integer"));
const address_1 = require("./address");
const location_1 = require("./location");
/**
 * Converts the result of a typechain-typed ethers.js contract call returning a
 * `RevealTypes.RevealedCoords` struct into a `RevealedCoords` object (see
 * @darkforest_eth/types)
 *
 * @param rawRevealedCoords the result of a typechain-typed ethers.js contract
 * call returning a RevealTypes.RevealedCoords` struct
 */
function decodeRevealedCoords(rawRevealedCoords) {
    const locationId = (0, location_1.locationIdFromDecStr)(rawRevealedCoords.locationId.toString());
    let xBI = (0, big_integer_1.default)(rawRevealedCoords.x.toString()); // nonnegative residue mod p
    let yBI = (0, big_integer_1.default)(rawRevealedCoords.y.toString()); // nonnegative residue mod p
    let x = 0;
    let y = 0;
    if (xBI.gt(constants_1.LOCATION_ID_UB.divide(2))) {
        xBI = xBI.minus(constants_1.LOCATION_ID_UB);
    }
    x = xBI.toJSNumber();
    if (yBI.gt(constants_1.LOCATION_ID_UB.divide(2))) {
        yBI = yBI.minus(constants_1.LOCATION_ID_UB);
    }
    y = yBI.toJSNumber();
    return {
        hash: locationId,
        x,
        y,
        revealer: (0, address_1.address)(rawRevealedCoords.revealer),
    };
}
exports.decodeRevealedCoords = decodeRevealedCoords;
//# sourceMappingURL=reveal.js.map