import bigInt from 'big-integer';
/**
 * Generate a random number based on some seed. Useful for procedural generation.
 *
 * @param seed The seed of the random number.
 */
export declare function seededRandom(seed: number): number;
/**
 * @hidden
 */
export declare const fakeHash: (planetRarity: number) => (x: number, y: number) => bigInt.BigInteger;
