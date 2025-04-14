"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifierTypeNames = exports.ModifierType = void 0;
/**
 * Enumeration of artifact rarity levels. Common = 1, Mythic = 5
 * # popCap, popGrowth, silverCap, silverGrowth, range, speed, defense
 */
exports.ModifierType = {
    PopulationCap: 0,
    PopulationGrowth: 1,
    SilverCap: 2,
    SilverGrowth: 3,
    Range: 4,
    Speed: 5,
    Defense: 6,
    Pirates: 7
    // Don't forget to update MIN_ARTIFACT_RARITY and/or MAX_ARTIFACT_RARITY in the `constants` package
};
/**
 * Mapping from ArtifactRarity to pretty-printed names.
 */
exports.ModifierTypeNames = {
    [exports.ModifierType.PopulationCap]: 'Energy Cap',
    [exports.ModifierType.PopulationGrowth]: 'Energy Gro.',
    [exports.ModifierType.SilverCap]: 'Silver Cap',
    [exports.ModifierType.SilverGrowth]: 'Silver Gro.',
    [exports.ModifierType.Range]: 'Range',
    [exports.ModifierType.Speed]: 'Speed',
    [exports.ModifierType.Defense]: 'Defense',
    [exports.ModifierType.Pirates]: 'Pirates'
};
//# sourceMappingURL=modifiers.js.map