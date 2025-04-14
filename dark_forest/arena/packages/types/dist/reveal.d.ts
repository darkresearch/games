import type { EthAddress, LocationId } from './identifier';
import type { WorldCoords, WorldLocation } from './world';
/**
 * Represents a planet location that has been broadcast on-chain
 */
export declare type RevealedCoords = WorldCoords & {
    hash: LocationId;
    revealer: EthAddress;
};
export declare type RevealedLocation = WorldLocation & {
    revealer: EthAddress;
};
