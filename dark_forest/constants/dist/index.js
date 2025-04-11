"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEGRAPH_API_URL = exports.LOCAL_OPTIMISM_CHAIN_ID = exports.GNOSIS_CHAIN_ID = exports.KOVAN_OPTIMISM_CHAIN_ID = exports.GNOSIS_OPTIMISM_CHAIN_ID = exports.HAT_SIZES = exports.SpecialKey = exports.PLANET_CLAIM_MIN_LEVEL = exports.RECOMMENDED_MODAL_WIDTH = exports.GAS_PRICES_INTERVAL_MS = exports.BLOCK_EXPLORER_URL = exports.MAX_AUTO_GAS_PRICE_GWEI = exports.DEFAULT_GAS_PRICES = exports.GAS_PRICE_API = exports.MAX_BIOME = exports.MIN_BIOME = exports.MAX_PLANET_LEVEL = exports.MIN_PLANET_LEVEL = exports.MAX_ARTIFACT_RARITY = exports.MIN_ARTIFACT_RARITY = exports.MAX_SPACESHIP_TYPE = exports.MIN_SPACESHIP_TYPE = exports.MAX_ARTIFACT_TYPE = exports.MIN_ARTIFACT_TYPE = exports.EMPTY_ARTIFACT_ID = exports.EMPTY_LOCATION_ID = exports.EMPTY_ADDRESS = exports.LOCATION_ID_UB = exports.DEFAULT_MAX_CALL_RETRIES = exports.CONTRACT_PRECISION = void 0;
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
const types_1 = require("@darkforest_eth/types");
const big_integer_1 = __importDefault(require("big-integer"));
/**
 * The precision of Energy & Silver stored in the Dark Forest smart contracts.
 *
 * Energy and Silver are not stored as floats in the smart contracts,
 * so any of those values coming from the contracts need to be divided by `CONTRACT_PRECISION`
 * and any values being sent to the contract need to be multiplied by `CONTRACT_PRECISION`.
 */
exports.CONTRACT_PRECISION = 1000;
/**
 * By default, the various {@link ContractCaller} will retry a blockchain read this many times.
 */
exports.DEFAULT_MAX_CALL_RETRIES = 12;
/**
 * The upper-bounds of a LocationID.
 *
 * Represents the maximum possible value that the MiMC hash function (used for IDing locations in the universe) can output.
 * A LocationID must be less than `LOCATION_ID_UB / PLANET_RARITY` in order to be considered a valid planet.
 */
exports.LOCATION_ID_UB = (0, big_integer_1.default)('21888242871839275222246405745257275088548364400416034343698204186575808495617');
/**
 * The 0x0 Ethereum address, which is used for unowned planets, artifacts without an owner, etc.
 */
exports.EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
/**
 * A blank LocationID (all zeros).
 */
exports.EMPTY_LOCATION_ID = '0000000000000000000000000000000000000000000000000000000000000000';
/**
 * A blank ArtifactID (all zeros).
 */
exports.EMPTY_ARTIFACT_ID = '0000000000000000000000000000000000000000000000000000000000000000';
/**
 * The value of the minimum, valid artifact type
 */
exports.MIN_ARTIFACT_TYPE = types_1.ArtifactType.Monolith;
/**
 * The value of the maximum, valid artifact type
 */
exports.MAX_ARTIFACT_TYPE = types_1.ArtifactType.ShipTitan;
/**
 * The value of the minimum, valid spaceship type
 */
exports.MIN_SPACESHIP_TYPE = types_1.ArtifactType.ShipMothership;
/**
 * The value of the maximum, valid spaceship type
 */
exports.MAX_SPACESHIP_TYPE = types_1.ArtifactType.ShipTitan;
/**
 * The value of the minimum, valid artifact rarity
 */
exports.MIN_ARTIFACT_RARITY = types_1.ArtifactRarity.Common;
/**
 * The value of the maximum, valid artifact rarity
 */
exports.MAX_ARTIFACT_RARITY = types_1.ArtifactRarity.Mythic;
/**
 * The value of the minimum, valid planet level
 */
exports.MIN_PLANET_LEVEL = types_1.PlanetLevel.ZERO;
/**
 * The value of the maximum, valid planet level
 */
exports.MAX_PLANET_LEVEL = types_1.PlanetLevel.NINE;
/**
 * The value of the minimum, valid biome
 */
exports.MIN_BIOME = types_1.Biome.OCEAN;
/**
 * The value of the maximum, valid biome
 */
exports.MAX_BIOME = types_1.Biome.CORRUPTED;
/**
 * The URL for xDai's API that returns the gas prices for 35th, 60th, and 90th percentiles of gas prices in the
 * previous 200 blocks. Useful for auto gas price setting.
 *
 * https://www.xdaichain.com/for-developers/developer-resources/gas-price-oracle
 */
exports.GAS_PRICE_API = 'https://blockscout.com/xdai/mainnet/api/v1/gas-price-oracle';
/**
 * In case we cannot load gas prices from xDai, these are the default auto gas prices.
 */
exports.DEFAULT_GAS_PRICES = {
    slow: 1,
    average: 3,
    fast: 10,
};
/**
 * In case xDai's auto-price is something ridiculous, we don't want our players to insta run out of
 * money.
 */
exports.MAX_AUTO_GAS_PRICE_GWEI = 15;
/**
 * The URL to the block explorer for the chain being used. Prepended to transaction links, etc
 */
// Careful, don't add a slash to the end of this.
exports.BLOCK_EXPLORER_URL = 'https://blockscout.com/xdai/optimism/tx';
/**
 * The amount of time between gas price refreshes when fetching prices from the oracle.
 */
exports.GAS_PRICES_INTERVAL_MS = 60000;
/**
 * {@link PlanetContextPane} is this wide, and all the subpanes of that modal also try to stay this
 * size as well.
 */
exports.RECOMMENDED_MODAL_WIDTH = '400px';
/**
 * The minimum level required for claiming a planet.
 */
exports.PLANET_CLAIM_MIN_LEVEL = 3;
/**
 * Keys to handle in a special fashion when dealing with key presses
 */
exports.SpecialKey = {
    Space: ' ',
    Tab: 'Tab',
    Escape: 'Escape',
    Control: 'Control',
    Shift: 'Shift',
};
exports.HAT_SIZES = [
    'None',
    'Tiny HAT',
    'Small HAT',
    'Medium HAT',
    'Large HAT',
    'Huge HAT',
    'Mega HAT',
    'Enormous HAT',
    'Titanic HAT',
    'Legendary HAT',
    'Almighty HAT',
    'Cosmic HAT',
    'Celestial HAT',
    'Empyrean HAT',
    'Ethereal HAT',
    'Transcendental HAT',
    'haaaat',
    'HAAAAT',
];
exports.GNOSIS_OPTIMISM_CHAIN_ID = 300;
exports.KOVAN_OPTIMISM_CHAIN_ID = 69;
exports.GNOSIS_CHAIN_ID = 100;
exports.LOCAL_OPTIMISM_CHAIN_ID = 17;
/**
 * This should be updated every round.
 */
exports.THEGRAPH_API_URL = 'https://graph-optimism.gnosischain.com/subgraphs/name/arena/test';
//# sourceMappingURL=index.js.map