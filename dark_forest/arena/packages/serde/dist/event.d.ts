import { NetworkEvent } from '@darkforest_eth/types';
/**
 * Returns whether or not the given event is an instance of {@link NetworkEvent}. Not super
 * stringent but works for now.
 */
export declare function isNetworkEvent(event: any): event is NetworkEvent;
