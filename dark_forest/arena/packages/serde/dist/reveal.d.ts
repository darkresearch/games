import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import type { RevealedCoords } from '@darkforest_eth/types';
export declare type RawRevealedCoords = Awaited<ReturnType<DarkForest['revealedCoords']>>;
/**
 * Converts the result of a typechain-typed ethers.js contract call returning a
 * `RevealTypes.RevealedCoords` struct into a `RevealedCoords` object (see
 * @darkforest_eth/types)
 *
 * @param rawRevealedCoords the result of a typechain-typed ethers.js contract
 * call returning a RevealTypes.RevealedCoords` struct
 */
export declare function decodeRevealedCoords(rawRevealedCoords: RawRevealedCoords): RevealedCoords;
