"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeUntilNextBroadcastAvailable = exports.isTargetPlanet = exports.isSpawnPlanet = exports.isLocatable = exports.isEmojiFlagMessage = exports.hasOwner = exports.getRange = exports.getPlanetRank = void 0;
const constants_1 = require("@darkforest_eth/constants");
const types_1 = require("@darkforest_eth/types");
const getPlanetRank = (planet) => {
    if (!planet)
        return 0;
    return planet.upgradeState.reduce((a, b) => a + b);
};
exports.getPlanetRank = getPlanetRank;
/**
 * @todo - planet class
 * @param rangeBoost A multiplier to be applied to the resulting range.
 * Currently used for calculating boost associated with abandoning a planet.
 */
function getRange(planet, percentEnergySending = 100, rangeBoost = 1) {
    if (percentEnergySending === 0)
        return 0;
    return Math.max(Math.log2(percentEnergySending / 5), 0) * planet.range * rangeBoost;
}
exports.getRange = getRange;
function hasOwner(planet) {
    return planet.owner !== constants_1.EMPTY_ADDRESS;
}
exports.hasOwner = hasOwner;
function isEmojiFlagMessage(planetMessage) {
    return planetMessage.body !== undefined && planetMessage.type === types_1.PlanetMessageType.EmojiFlag;
}
exports.isEmojiFlagMessage = isEmojiFlagMessage;
function isLocatable(planet) {
    return planet !== undefined && planet.location !== undefined;
}
exports.isLocatable = isLocatable;
function isSpawnPlanet(planet) {
    return planet !== undefined && planet.isSpawnPlanet;
}
exports.isSpawnPlanet = isSpawnPlanet;
function isTargetPlanet(planet) {
    return planet !== undefined && planet.isTargetPlanet;
}
exports.isTargetPlanet = isTargetPlanet;
/**
 * Gets the time (ms) until we can broadcast the coordinates of a planet.
 */
function timeUntilNextBroadcastAvailable(lastRevealTimestamp, locationRevealCooldown) {
    if (!lastRevealTimestamp) {
        return 0;
    }
    // both the variables in the next line are denominated in seconds
    return (lastRevealTimestamp + locationRevealCooldown) * 1000 - Date.now();
}
exports.timeUntilNextBroadcastAvailable = timeUntilNextBroadcastAvailable;
//# sourceMappingURL=planet.js.map