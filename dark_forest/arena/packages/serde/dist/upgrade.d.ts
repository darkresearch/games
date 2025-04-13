import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import type { Upgrade, UpgradeBranches } from '@darkforest_eth/types';
export declare type RawUpgrade = Awaited<ReturnType<DarkForest['getArtifactById']>>['upgrade'];
export declare type RawUpgradesBranches = Awaited<ReturnType<DarkForest['getUpgrades']>>;
/**
 * Converts raw data received from a typechain-typed ethers.js contract call
 * returning a `UpgradeTypes.Upgrade` into an `Upgrade` object (see
 * @darkforest_eth/types)
 *
 * @param rawUpgrade raw data received from a typechain-typed ethers.js contract
 * call returning a `UpgradeTypes.Upgrade`
 */
export declare function decodeUpgrade(rawUpgrade: RawUpgrade): Upgrade;
/**
 * Converts the raw return value of an ether.js contract call to
 * `DarkForest.getUpgrades` to a 2D array of `Upgrade`s.
 *
 * @param rawUpgradeBranches raw return value of ether.js contract call to
 * `DarkForest.getUpgrades`
 */
export declare function decodeUpgradeBranches(rawUpgradeBranches: RawUpgradesBranches): UpgradeBranches;
