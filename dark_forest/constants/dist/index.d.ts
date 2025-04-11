/**
 * This package contains useful constants for use when interacting with
 * the Dark Forest smart contracts within JavaScript or TypeScript.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @darkforest_eth/constants
 * ```
 * ```bash
 * yarn add @darkforest_eth/constants
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as constants from 'http://cdn.skypack.dev/@darkforest_eth/constants'
 * ```
 *
 * @packageDocumentation
 */
import { ArtifactId, ArtifactRarity, ArtifactType, Biome, EthAddress, GasPrices, LocationId, PlanetLevel } from '@darkforest_eth/types';
import { BigInteger } from 'big-integer';
/**
 * The precision of Energy & Silver stored in the Dark Forest smart contracts.
 *
 * Energy and Silver are not stored as floats in the smart contracts,
 * so any of those values coming from the contracts need to be divided by `CONTRACT_PRECISION`
 * and any values being sent to the contract need to be multiplied by `CONTRACT_PRECISION`.
 */
export declare const CONTRACT_PRECISION: 1000;
/**
 * By default, the various {@link ContractCaller} will retry a blockchain read this many times.
 */
export declare const DEFAULT_MAX_CALL_RETRIES: 12;
/**
 * The upper-bounds of a LocationID.
 *
 * Represents the maximum possible value that the MiMC hash function (used for IDing locations in the universe) can output.
 * A LocationID must be less than `LOCATION_ID_UB / PLANET_RARITY` in order to be considered a valid planet.
 */
export declare const LOCATION_ID_UB: BigInteger;
/**
 * The 0x0 Ethereum address, which is used for unowned planets, artifacts without an owner, etc.
 */
export declare const EMPTY_ADDRESS: EthAddress;
/**
 * A blank LocationID (all zeros).
 */
export declare const EMPTY_LOCATION_ID: LocationId;
/**
 * A blank ArtifactID (all zeros).
 */
export declare const EMPTY_ARTIFACT_ID: ArtifactId;
/**
 * The value of the minimum, valid artifact type
 */
export declare const MIN_ARTIFACT_TYPE: ArtifactType;
/**
 * The value of the maximum, valid artifact type
 */
export declare const MAX_ARTIFACT_TYPE: ArtifactType;
/**
 * The value of the minimum, valid spaceship type
 */
export declare const MIN_SPACESHIP_TYPE: ArtifactType;
/**
 * The value of the maximum, valid spaceship type
 */
export declare const MAX_SPACESHIP_TYPE: ArtifactType;
/**
 * The value of the minimum, valid artifact rarity
 */
export declare const MIN_ARTIFACT_RARITY: ArtifactRarity;
/**
 * The value of the maximum, valid artifact rarity
 */
export declare const MAX_ARTIFACT_RARITY: ArtifactRarity;
/**
 * The value of the minimum, valid planet level
 */
export declare const MIN_PLANET_LEVEL: PlanetLevel;
/**
 * The value of the maximum, valid planet level
 */
export declare const MAX_PLANET_LEVEL: PlanetLevel;
/**
 * The value of the minimum, valid biome
 */
export declare const MIN_BIOME: Biome;
/**
 * The value of the maximum, valid biome
 */
export declare const MAX_BIOME: Biome;
/**
 * The URL for xDai's API that returns the gas prices for 35th, 60th, and 90th percentiles of gas prices in the
 * previous 200 blocks. Useful for auto gas price setting.
 *
 * https://www.xdaichain.com/for-developers/developer-resources/gas-price-oracle
 */
export declare const GAS_PRICE_API: "https://blockscout.com/xdai/mainnet/api/v1/gas-price-oracle";
/**
 * In case we cannot load gas prices from xDai, these are the default auto gas prices.
 */
export declare const DEFAULT_GAS_PRICES: GasPrices;
/**
 * In case xDai's auto-price is something ridiculous, we don't want our players to insta run out of
 * money.
 */
export declare const MAX_AUTO_GAS_PRICE_GWEI: 15;
/**
 * The URL to the block explorer for the chain being used. Prepended to transaction links, etc
 */
export declare const BLOCK_EXPLORER_URL: "https://blockscout.com/xdai/optimism/tx";
/**
 * The amount of time between gas price refreshes when fetching prices from the oracle.
 */
export declare const GAS_PRICES_INTERVAL_MS: 60000;
/**
 * {@link PlanetContextPane} is this wide, and all the subpanes of that modal also try to stay this
 * size as well.
 */
export declare const RECOMMENDED_MODAL_WIDTH: "400px";
/**
 * The minimum level required for claiming a planet.
 */
export declare const PLANET_CLAIM_MIN_LEVEL: 3;
/**
 * Keys to handle in a special fashion when dealing with key presses
 */
export declare const SpecialKey: {
    readonly Space: " ";
    readonly Tab: "Tab";
    readonly Escape: "Escape";
    readonly Control: "Control";
    readonly Shift: "Shift";
};
export declare const HAT_SIZES: string[];
export declare const GNOSIS_OPTIMISM_CHAIN_ID: 300;
export declare const KOVAN_OPTIMISM_CHAIN_ID: 69;
export declare const GNOSIS_CHAIN_ID: 100;
export declare const LOCAL_OPTIMISM_CHAIN_ID: 17;
/**
 * This should be updated every round.
 */
export declare const THEGRAPH_API_URL = "https://graph-optimism.gnosischain.com/subgraphs/name/arena/test";
