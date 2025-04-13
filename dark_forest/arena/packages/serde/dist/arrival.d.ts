import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import type { QueuedArrival } from '@darkforest_eth/types';
export declare type RawArrival = Awaited<ReturnType<DarkForest['getPlanetArrival']>>;
/**
 * Converts the raw typechain result of `ArrivalTypes.ArrivalData` struct to
 * to a `QueuedArrival` typescript typed object (see @darkforest_eth/types)
 *
 * @param rawArrival Raw data of a `ArrivalTypes.ArrivalData` struct,
 * returned from a blockchain call (assumed to be typed with typechain).
 */
export declare function decodeArrival(rawArrival: RawArrival): QueuedArrival;
