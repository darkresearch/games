import { EmojiFlagBody, LocatablePlanet, Planet, PlanetMessage } from '@darkforest_eth/types';
export declare const getPlanetRank: (planet: Planet | undefined) => number;
/**
 * @todo - planet class
 * @param rangeBoost A multiplier to be applied to the resulting range.
 * Currently used for calculating boost associated with abandoning a planet.
 */
export declare function getRange(planet: Planet, percentEnergySending?: number, rangeBoost?: number): number;
export declare function hasOwner(planet: Planet): boolean;
export declare function isEmojiFlagMessage(planetMessage: PlanetMessage<unknown>): planetMessage is PlanetMessage<EmojiFlagBody>;
export declare function isLocatable(planet?: Planet): planet is LocatablePlanet;
export declare function isSpawnPlanet(planet?: Planet): boolean;
export declare function isTargetPlanet(planet?: Planet): boolean;
/**
 * Gets the time (ms) until we can broadcast the coordinates of a planet.
 */
export declare function timeUntilNextBroadcastAvailable(lastRevealTimestamp: number | undefined, locationRevealCooldown: number): number;
