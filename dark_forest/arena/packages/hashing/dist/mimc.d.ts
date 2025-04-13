import bigInt, { BigInteger } from 'big-integer';
export declare const p: bigInt.BigInteger;
export declare function mimcSponge(inputs: BigInteger[], nOutputs: number, rounds: number, key: number): BigInteger[];
/**
 * Modulo a number with the LOCATION_ID_UB constant.
 * If the result is < 0, the LOCATION_ID_UB will then be added.
 *
 * @param x The number to modulo against LOCATION_ID_UB
 */
export declare function modPBigInt(x: number): bigInt.BigInteger;
/**
 * Modulo a BigInt with the LOCATION_ID_UB constant.
 * If the result is < 0, the LOCATION_ID_UB will then be added.
 *
 * @param x The number to modulo against LOCATION_ID_UB
 */
export declare function modPBigIntNative(x: BigInteger): bigInt.BigInteger;
export declare const mimcWithRounds: (rounds: number, key: number) => (...inputs: number[]) => bigInt.BigInteger;
/**
 * The primary function used to build any MiMC hashing algorithm for Dark Forest.
 *
 * @param key The key for the MiMC algorithm. Will usually be PLANETHASH_KEY, SPACETYPE_KEY, or BIOMEBASE_KEY.
 */
declare function mimcHash(key: number): (...inputs: number[]) => bigInt.BigInteger;
export declare const perlinRandHash: (key: number) => (...inputs: number[]) => bigInt.BigInteger;
export default mimcHash;
