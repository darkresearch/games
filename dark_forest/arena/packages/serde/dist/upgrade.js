"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeUpgradeBranches = exports.decodeUpgrade = void 0;
/**
 * Converts raw data received from a typechain-typed ethers.js contract call
 * returning a `UpgradeTypes.Upgrade` into an `Upgrade` object (see
 * @darkforest_eth/types)
 *
 * @param rawUpgrade raw data received from a typechain-typed ethers.js contract
 * call returning a `UpgradeTypes.Upgrade`
 */
function decodeUpgrade(rawUpgrade) {
    return {
        energyCapMultiplier: rawUpgrade.popCapMultiplier.toNumber(),
        energyGroMultiplier: rawUpgrade.popGroMultiplier.toNumber(),
        rangeMultiplier: rawUpgrade.rangeMultiplier.toNumber(),
        speedMultiplier: rawUpgrade.speedMultiplier.toNumber(),
        defMultiplier: rawUpgrade.defMultiplier.toNumber(),
    };
}
exports.decodeUpgrade = decodeUpgrade;
/**
 * Converts the raw return value of an ether.js contract call to
 * `DarkForest.getUpgrades` to a 2D array of `Upgrade`s.
 *
 * @param rawUpgradeBranches raw return value of ether.js contract call to
 * `DarkForest.getUpgrades`
 */
function decodeUpgradeBranches(rawUpgradeBranches) {
    return rawUpgradeBranches.map((a) => a.map(decodeUpgrade));
}
exports.decodeUpgradeBranches = decodeUpgradeBranches;
//# sourceMappingURL=upgrade.js.map