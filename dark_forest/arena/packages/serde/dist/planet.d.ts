import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import type { Planet, PlanetDefaults } from '@darkforest_eth/types';
export declare type RawPlanet = Awaited<ReturnType<DarkForest['planets']>>;
export declare type RawPlanetExtendedInfo = Awaited<ReturnType<DarkForest['planetsExtendedInfo']>>;
export declare type RawPlanetExtendedInfo2 = Awaited<ReturnType<DarkForest['planetsExtendedInfo2']>>;
export declare type RawPlanetArenaInfo = Awaited<ReturnType<DarkForest['planetsArenaInfo']>>;
/**
 * Converts data obtained from a contract call (typed with Typechain) into a
 * `Planet` that can be used by the client (see @darkforest_eth/types). Note
 * that some `Planet` fields (1) store client data that the blockchain is not
 * aware of, such as `unconfirmedDepartures`, (2) store derived data that is
 * calculated later by the client, such as `silverSpent` and `bonus`, or (3)
 * store data which must be added later from the results of additional contract
 * calls, such as `coordsRevealed` and `heldArtifactIds`. Therefore this
 * function may not be very useful to you outside of the specific context of the
 * provided Dark Forest web client.
 *
 * @param rawLocationId string of decimal digits representing a number equal to
 * a planet's ID
 * @param rawPlanet typechain-typed result of a call returning a
 * `PlanetTypes.Planet`
 * @param rawPlanetExtendedInfo typechain-typed result of a call returning a
 * `PlanetTypes.PlanetExtendedInfo`
 * @param rawPlanetExtendedInfo2 typechain-typed result of a call returning a
 * `PlanetTypes.PlanetExtendedInfo2`
 *  * @param rawPlanetArenaInfo typechain-typed result of a call returning a
 * `PlanetTypes.PlanetArenaInfo`
 */
export declare function decodePlanet(rawLocationId: string, rawPlanet: RawPlanet, rawPlanetExtendedInfo: RawPlanetExtendedInfo, rawPlanetExtendedInfo2: RawPlanetExtendedInfo2, rawPlanetArenaInfo: RawPlanetArenaInfo): Planet;
declare type RawDefaults = Awaited<ReturnType<DarkForest['getDefaultStats']>>;
/**
 * Converts the raw typechain result of a call which fetches a
 * `PlanetTypes.PlanetDefaultStats[]` array of structs, and converts it into
 * an object with type `PlanetDefaults` (see @darkforest_eth/types).
 *
 * @param rawDefaults result of a ethers.js contract call which returns a raw
 * `PlanetTypes.PlanetDefaultStats` struct, typed with typechain.
 */
export declare function decodePlanetDefaults(rawDefaults: RawDefaults): PlanetDefaults;
export {};
