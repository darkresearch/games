import { PerlinConfig } from '@darkforest_eth/types';
import { IFraction } from './fractions/bigFraction';
/**
 * A object containing a pair of x,y coordinates.
 */
export interface IntegerVector {
    x: number;
    y: number;
}
interface Vector {
    x: IFraction;
    y: IFraction;
}
declare type HashFn = (...inputs: number[]) => number;
export declare const rand: (key: number) => (...args: number[]) => number;
export declare const getRandomGradientAt: (point: Vector, scale: IFraction, randFn: HashFn) => Vector;
export declare const MAX_PERLIN_VALUE = 32;
/**
 * Calculates the perlin for a location, given the x,y pair and the PerlinConfig for the game.
 *
 * @param coords An object of the x,y coordinates for which perlin is being calculated.
 * @param options An object containing the configuration for the perlin algorithm.
 */
export declare function perlin(coords: IntegerVector, options: PerlinConfig): number;
export {};
