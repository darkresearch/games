"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiomeNames = exports.Biome = exports.SpaceTypeNames = exports.SpaceType = void 0;
/**
 * Enumeration of the types of space in the game. NEBULA = 0, DEAD_SPACE = 3
 */
exports.SpaceType = {
    NEBULA: 0,
    SPACE: 1,
    DEEP_SPACE: 2,
    DEAD_SPACE: 3,
};
/**
 * Mapping from SpaceType to pretty-printed names.
 */
exports.SpaceTypeNames = {
    [exports.SpaceType.NEBULA]: 'Nebula',
    [exports.SpaceType.SPACE]: 'Space',
    [exports.SpaceType.DEEP_SPACE]: 'Deep Space',
    [exports.SpaceType.DEAD_SPACE]: 'Dead Space',
};
/**
 * Enumeration of the biomes in the game. OCEAN = 1, CORRUPTED = 10
 */
exports.Biome = {
    UNKNOWN: 0,
    OCEAN: 1,
    FOREST: 2,
    GRASSLAND: 3,
    TUNDRA: 4,
    SWAMP: 5,
    DESERT: 6,
    ICE: 7,
    WASTELAND: 8,
    LAVA: 9,
    CORRUPTED: 10,
    // Don't forget to update MIN_BIOME and/or MAX_BIOME in the `constants` package
};
/**
 * Mapping from Biome to pretty-printed names.
 */
exports.BiomeNames = {
    [exports.Biome.UNKNOWN]: 'Unknown',
    [exports.Biome.OCEAN]: 'Ocean',
    [exports.Biome.FOREST]: 'Forest',
    [exports.Biome.GRASSLAND]: 'Grassland',
    [exports.Biome.TUNDRA]: 'Tundra',
    [exports.Biome.SWAMP]: 'Swamp',
    [exports.Biome.DESERT]: 'Desert',
    [exports.Biome.ICE]: 'Ice',
    [exports.Biome.WASTELAND]: 'Wasteland',
    [exports.Biome.LAVA]: 'Lava',
    [exports.Biome.CORRUPTED]: 'Corrupted',
};
//# sourceMappingURL=game_types.js.map