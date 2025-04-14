import type { Abstract } from './utility';
export declare type ModifierType = Abstract<number, 'ModifierType'>;
/**
 * Enumeration of artifact rarity levels. Common = 1, Mythic = 5
 * # popCap, popGrowth, silverCap, silverGrowth, range, speed, defense
 */
export declare const ModifierType: {
    readonly PopulationCap: ModifierType;
    readonly PopulationGrowth: ModifierType;
    readonly SilverCap: ModifierType;
    readonly SilverGrowth: ModifierType;
    readonly Range: ModifierType;
    readonly Speed: ModifierType;
    readonly Defense: ModifierType;
    readonly Pirates: ModifierType;
};
/**
 * Mapping from ArtifactRarity to pretty-printed names.
 */
export declare const ModifierTypeNames: {
    readonly [x: number]: "Pirates" | "Range" | "Speed" | "Defense" | "Energy Cap" | "Energy Gro." | "Silver Cap" | "Silver Gro.";
};
