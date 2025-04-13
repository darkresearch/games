import { GasPrices } from '@darkforest_eth/types';
/**
 * Gets the current gas prices from xDai's price oracle. If the oracle is broken, return some sane
 * defaults.
 */
export declare function getAutoGasPrices(): Promise<GasPrices>;
