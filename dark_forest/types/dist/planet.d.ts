import type { Biome, SpaceType } from './game_types';
import type { ArtifactId, EthAddress, LocationId } from './identifier';
import type { PlanetMessage } from './planetmessage';
import type { TransactionCollection } from './transaction';
import type { Upgrade, UpgradeState } from './upgrade';
import type { Abstract } from './utility';
import type { WorldLocation } from './world';
/**
 * Abstract type representing a planet level.
 */
export declare type PlanetLevel = Abstract<number, 'PlanetLevel'>;
/**
 * Enumeration of the possible planet levels.
 */
export declare const PlanetLevel: {
    readonly ZERO: PlanetLevel;
    readonly ONE: PlanetLevel;
    readonly TWO: PlanetLevel;
    readonly THREE: PlanetLevel;
    readonly FOUR: PlanetLevel;
    readonly FIVE: PlanetLevel;
    readonly SIX: PlanetLevel;
    readonly SEVEN: PlanetLevel;
    readonly EIGHT: PlanetLevel;
    readonly NINE: PlanetLevel;
};
/**
 * Mapping from PlanetLevel to pretty-printed names.
 */
export declare const PlanetLevelNames: {
    readonly [x: number]: "Level 0" | "Level 1" | "Level 2" | "Level 3" | "Level 4" | "Level 5" | "Level 6" | "Level 7" | "Level 8" | "Level 9";
};
/**
 * Abstract type representing a planet type.
 */
export declare type PlanetType = Abstract<number, 'PlanetType'>;
/**
 * Enumeration of the planet types. (PLANET = 0, SILVER_BANK = 4)
 */
export declare const PlanetType: {
    readonly PLANET: PlanetType;
    readonly SILVER_MINE: PlanetType;
    readonly RUINS: PlanetType;
    readonly TRADING_POST: PlanetType;
    readonly SILVER_BANK: PlanetType;
};
/**
 * Mapping from PlanetType to pretty-printed names.
 */
export declare const PlanetTypeNames: {
    readonly [x: number]: "Planet" | "Asteroid Field" | "Foundry" | "Spacetime Rip" | "Quasar";
};
/**
 * A list of five flags, indicating whether the planet has an attached comet
 * doubling each of five stats: (in order) [energyCap, energyGrowth, range,
 * speed, defense]
 */
export declare type PlanetBonus = [boolean, boolean, boolean, boolean, boolean, boolean];
/**
 * Represents a Dark Forest planet object (planets, asteroid fields, quasars,
 * spacetime rips, and foundries). Note that some `Planet` fields (1) store
 * client-specific data that the blockchain is not aware of, such as
 * `unconfirmedDepartures` (tracks pending moves originating at this planet that
 * have been submitted to the blockchain from a client), or (2) store derived
 * data that is calculated separately client-side, such as `silverSpent` and
 * `bonus`. So this object does not cleanly map to any single object in the
 * DarkForest contract (or even any collection of objects).
 */
export declare type Planet = {
    locationId: LocationId;
    perlin: number;
    spaceType: SpaceType;
    owner: EthAddress;
    hatLevel: number;
    planetLevel: PlanetLevel;
    planetType: PlanetType;
    isHomePlanet: boolean;
    energyCap: number;
    energyGrowth: number;
    silverCap: number;
    silverGrowth: number;
    range: number;
    defense: number;
    speed: number;
    energy: number;
    silver: number;
    spaceJunk: number;
    lastUpdated: number;
    upgradeState: UpgradeState;
    hasTriedFindingArtifact: boolean;
    heldArtifactIds: ArtifactId[];
    destroyed: boolean;
    prospectedBlockNumber?: number;
    localPhotoidUpgrade?: Upgrade;
    transactions?: TransactionCollection;
    unconfirmedAddEmoji: boolean;
    unconfirmedClearEmoji: boolean;
    loadingServerState: boolean;
    needsServerRefresh: boolean;
    lastLoadedServerState?: number;
    emojiBobAnimation?: DFAnimation;
    emojiZoopAnimation?: DFAnimation;
    emojiZoopOutAnimation?: DFStatefulAnimation<string>;
    silverSpent: number;
    isInContract: boolean;
    syncedWithContract: boolean;
    coordsRevealed: boolean;
    revealer?: EthAddress;
    claimer?: EthAddress;
    messages?: PlanetMessage<unknown>[];
    bonus: PlanetBonus;
    pausers: number;
    invader?: EthAddress;
    capturer?: EthAddress;
    invadeStartBlock?: number;
    isTargetPlanet: boolean;
    isSpawnPlanet: boolean;
    blockedPlanetIds: LocationId[];
};
/**
 * A planet whose coordinates are known to the client.
 */
export declare type LocatablePlanet = Planet & {
    location: WorldLocation;
    biome: Biome;
};
/**
 * A structure with default stats of planets in nebula at corresponding levels. For
 * example, silverCap[4] refers to the default silver capacity of a level 4
 * planet in nebula with no modifiers.
 */
export interface PlanetDefaults {
    populationCap: number[];
    populationGrowth: number[];
    range: number[];
    speed: number[];
    defense: number[];
    silverGrowth: number[];
    silverCap: number[];
    barbarianPercentage: number[];
}
export declare class DFAnimation {
    private readonly _update;
    private _value;
    constructor(update: () => number);
    update(): void;
    value(): number;
}
export declare class DFStatefulAnimation<T> extends DFAnimation {
    private readonly _state;
    constructor(state: T, update: () => number);
    state(): T;
}
export declare type AdminPlanet = {
    x: number;
    y: number;
    level: number;
    planetType: number;
    requireValidLocationId: boolean;
    revealLocation: boolean;
    isTargetPlanet: boolean;
    isSpawnPlanet: boolean;
};
