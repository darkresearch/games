import type { Abstract } from './utility';
export declare type SpaceshipType = Abstract<number, 'SpaceshipType'>;
/**
 * Enumeration of spaceships
 */
export declare const SpaceshipType: {
    readonly Mothership: SpaceshipType;
    readonly Whale: SpaceshipType;
    readonly Crescent: SpaceshipType;
    readonly Gear: SpaceshipType;
    readonly Titan: SpaceshipType;
};
/**
 * Mapping from Spaceships to pretty-printed names.
 */
export declare const SpaceshipTypeNames: {
    readonly [x: number]: "Mothership" | "Crescent" | "Whale" | "Gear" | "Titan";
};
/**
 * Mapping from Spaceships to pretty-printed descriptions.
 */
export declare const SpaceshipTypeDesc: {
    readonly [x: number]: "2x Energy Growth" | "2x Silver Growth" | "Convert to Asteroid" | "Prospect Artifacts" | "Halt Energy & Silver Growth";
};
