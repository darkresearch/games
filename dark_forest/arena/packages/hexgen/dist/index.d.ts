/**
 * This package contains functions for determining various properties of Dark Forest objects based on their ID in hex. You could think of this package like procedural generation for Ethereum addresses.
 *
 * **Note:** This package _might_ go away when objects become classes that contain a lot of these helpers as instance methods.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @darkforest_eth/hexgen
 * ```
 * ```bash
 * yarn add @darkforest_eth/hexgen
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as hexgen from 'http://cdn.skypack.dev/@darkforest_eth/hexgen'
 * ```
 *
 * @packageDocumentation
 */
import type { LocationId, Planet, PlanetBonus } from '@darkforest_eth/types';
import bigInt from 'big-integer';
/**
 * The core method for extracting planet details from a LocationID.
 *
 * @param hexStr LocationID of a planet.
 * @param startByte The first byte to include in the result.
 * @param endByte The byte _after_ the last byte to include in the result.
 */
export declare function getBytesFromHex(hexStr: string, startByte: number, endByte: number): bigInt.BigInteger;
/**
 * Extracts the bonuses of a planet given its LocationID.
 *
 * @param hex LocationID of a planet.
 */
export declare function bonusFromHex(hex: LocationId): PlanetBonus;
/**
 * Checks if the LocationID of the planet indicates any bonuses.
 *
 * @param planet Planet to check for bonuses.
 */
export declare function planetHasBonus(planet?: Planet): boolean;
