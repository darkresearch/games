import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import type { Player } from '@darkforest_eth/types';
export declare type RawPlayer = Awaited<ReturnType<DarkForest['players']>>;
export declare type RawArenaPlayer = Awaited<ReturnType<DarkForest['arenaPlayers']>>;
/**
 * Converts the raw typechain result of a call which fetches a
 * `PlayerTypes.Player` struct, and converts it into an object
 * with type `Player` (see @darkforest_eth/types) that can be used by a client.
 *
 * @param rawPlayer result of an ethers.js contract call which returns a raw
 * `PlayerTypes.Player` struct, typed with typechain.
 */
export declare function decodePlayer(rawPlayer: RawPlayer, rawArenaPlayer: RawArenaPlayer): Player;
