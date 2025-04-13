import type { Abstract } from './utility';
/**
 * Abstract type representing a type of space.
 */
export declare type SpaceType = Abstract<number, 'SpaceType'>;
/**
 * Enumeration of the types of space in the game. NEBULA = 0, DEAD_SPACE = 3
 */
export declare const SpaceType: {
    readonly NEBULA: SpaceType;
    readonly SPACE: SpaceType;
    readonly DEEP_SPACE: SpaceType;
    readonly DEAD_SPACE: SpaceType;
};
/**
 * Mapping from SpaceType to pretty-printed names.
 */
export declare const SpaceTypeNames: {
    readonly [x: number]: "Nebula" | "Space" | "Deep Space" | "Dead Space";
};
/**
 * Abstract type representing a biome.
 */
export declare type Biome = Abstract<number, 'Biome'>;
/**
 * Enumeration of the biomes in the game. OCEAN = 1, CORRUPTED = 10
 */
export declare const Biome: {
    readonly UNKNOWN: Biome;
    readonly OCEAN: Biome;
    readonly FOREST: Biome;
    readonly GRASSLAND: Biome;
    readonly TUNDRA: Biome;
    readonly SWAMP: Biome;
    readonly DESERT: Biome;
    readonly ICE: Biome;
    readonly WASTELAND: Biome;
    readonly LAVA: Biome;
    readonly CORRUPTED: Biome;
};
/**
 * Mapping from Biome to pretty-printed names.
 */
export declare const BiomeNames: {
    readonly [x: number]: "Unknown" | "Ocean" | "Forest" | "Grassland" | "Tundra" | "Swamp" | "Desert" | "Ice" | "Wasteland" | "Lava" | "Corrupted";
};
