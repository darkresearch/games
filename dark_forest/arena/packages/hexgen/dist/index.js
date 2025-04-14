"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.planetHasBonus = exports.bonusFromHex = exports.getBytesFromHex = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
/**
 * The core method for extracting planet details from a LocationID.
 *
 * @param hexStr LocationID of a planet.
 * @param startByte The first byte to include in the result.
 * @param endByte The byte _after_ the last byte to include in the result.
 */
function getBytesFromHex(hexStr, startByte, endByte) {
    const byteString = hexStr.substring(2 * startByte, 2 * endByte);
    return (0, big_integer_1.default)(`0x${byteString}`);
}
exports.getBytesFromHex = getBytesFromHex;
// This is a cache of bonuses by LocationID to avoid an expensive recalc
const bonusById = new Map();
/**
 * Extracts the bonuses of a planet given its LocationID.
 *
 * @param hex LocationID of a planet.
 */
function bonusFromHex(hex) {
    const bonus = bonusById.get(hex);
    if (bonus)
        return bonus;
    const newBonus = Array(6).fill(false);
    for (let i = 0; i < newBonus.length; i++) {
        newBonus[i] = getBytesFromHex(hex, 9 + i, 10 + i).lesser(16);
    }
    bonusById.set(hex, newBonus);
    return newBonus;
}
exports.bonusFromHex = bonusFromHex;
/**
 * Checks if the LocationID of the planet indicates any bonuses.
 *
 * @param planet Planet to check for bonuses.
 */
function planetHasBonus(planet) {
    if (!planet)
        return false;
    return bonusFromHex(planet.locationId).some((bonus) => bonus);
}
exports.planetHasBonus = planetHasBonus;
//# sourceMappingURL=index.js.map