import type { Abstract } from './utility';
/**
 * The effects of an upgrade on the stats of a planet. Both upgrades purchased
 * for silver as well as artifacts of certain types can modify stats of a
 * planet.
 */
export declare type Upgrade = {
    energyCapMultiplier: number;
    energyGroMultiplier: number;
    rangeMultiplier: number;
    speedMultiplier: number;
    defMultiplier: number;
};
/**
 * On a single upgrade branch, the stat effects of the four upgrades.
 */
export declare type UpgradeLevels = [Upgrade, Upgrade, Upgrade, Upgrade];
/**
 * Stores the stat effects of upgrades of all three branches: defense, range,
 * speed.
 */
export declare type UpgradeBranches = [UpgradeLevels, UpgradeLevels, UpgradeLevels];
/**
 * How many times a planet has been upgraded along each of the three branches:
 * defense, range, and speed
 */
export declare type UpgradeState = [number, number, number];
/**
 * Abstract type representing an upgrade branch.
 */
export declare type UpgradeBranchName = Abstract<number, 'UpgradeBranchName'>;
/**
 * Enumeration of the three upgrade branches.
 */
export declare const UpgradeBranchName: {
    readonly Defense: UpgradeBranchName;
    readonly Range: UpgradeBranchName;
    readonly Speed: UpgradeBranchName;
};
