import type { EthAddress } from '@darkforest_eth/types';
/**
 * Converts a string to an `EthAddress`: a 0x-prefixed all lowercase hex string
 * of 40 hex characters. An object of the `EthAddress` type should only ever be
 * initialized through this constructor-like method. Throws if the provided
 * string cannot be parsed as an Ethereum address.
 *
 * @param str An address-like `string`
 */
export declare function isAddress(str: string): boolean;
export declare function address(str: string): EthAddress;
export declare function hashToInt(hash: string): number;
