"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeArtifact = exports.decodeArtifactPointValues = exports.artifactIdToDecStr = exports.artifactIdFromEthersBN = exports.artifactIdFromDecStr = exports.artifactIdFromHexStr = void 0;
const types_1 = require("@darkforest_eth/types");
const big_integer_1 = __importDefault(require("big-integer"));
const address_1 = require("./address");
const location_1 = require("./location");
const upgrade_1 = require("./upgrade");
/**
 * Converts a possibly 0x-prefixed string of hex digits to an `ArtifactId`: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). ArtifactIDs should only be instantiated through
 * `artifactIdFromHexStr`, `artifactIdFromDecStr`, and `artifactIdFromEthersBN`.
 *
 * @param artifactId Possibly 0x-prefixed, possibly unpadded hex `string`
 * representation of an artifact's ID.
 */
function artifactIdFromHexStr(artifactId) {
    const artifactIdBI = (0, big_integer_1.default)(artifactId, 16);
    let ret = artifactIdBI.toString(16);
    if (ret.length > 64)
        throw new Error('not a valid artifact id');
    while (ret.length < 64)
        ret = '0' + ret;
    return ret;
}
exports.artifactIdFromHexStr = artifactIdFromHexStr;
/**
 * Converts a string representing a decimal number into an ArtifactID: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). ArtifactIDs should only be instantiated through
 * `artifactIdFromHexStr`, `artifactIdFromDecStr`, and `artifactIdFromEthersBN`.
 *
 * @param artifactId `string` of decimal digits, the base 10 representation of an
 * artifact ID.
 */
function artifactIdFromDecStr(artifactId) {
    const locationBI = (0, big_integer_1.default)(artifactId);
    let ret = locationBI.toString(16);
    while (ret.length < 64)
        ret = '0' + ret;
    return ret;
}
exports.artifactIdFromDecStr = artifactIdFromDecStr;
/**
 * Converts a ethers.js BigNumber (type aliased here as EthersBN) representing a
 * decimal number into an ArtifactID: a non-0x-prefixed all lowercase hex string
 * of exactly 64 hex characters (0-padded if necessary). ArtifactIDs should only
 * be instantiated through `artifactIdFromHexStr`, `artifactIdFromDecStr`, and
 * `artifactIdFromEthersBN`.
 *
 * @param artifactId ether.js `BigNumber` representing artifact's ID
 */
function artifactIdFromEthersBN(artifactId) {
    return artifactIdFromDecStr(artifactId.toString());
}
exports.artifactIdFromEthersBN = artifactIdFromEthersBN;
/**
 * Converts an ArtifactID to a decimal string with equivalent numerical value;
 * can be used if you need to pass an artifact ID into a web3 call.
 *
 * @param artifactId non-0x-prefixed lowercase hex `string` of 64 hex characters
 * representing an artifact's ID
 */
function artifactIdToDecStr(artifactId) {
    return (0, big_integer_1.default)(artifactId, 16).toString(10);
}
exports.artifactIdToDecStr = artifactIdToDecStr;
/**
 * Converts the raw typechain result of a call to
 * `DarkForest.getArtifactPointValues` to an `ArtifactPointValues`
 * typescript typed object (see @darkforest_eth/types).
 */
function decodeArtifactPointValues(rawPointValues) {
    return {
        [types_1.ArtifactRarity.Unknown]: rawPointValues[types_1.ArtifactRarity.Unknown].toNumber(),
        [types_1.ArtifactRarity.Common]: rawPointValues[types_1.ArtifactRarity.Common].toNumber(),
        [types_1.ArtifactRarity.Rare]: rawPointValues[types_1.ArtifactRarity.Rare].toNumber(),
        [types_1.ArtifactRarity.Epic]: rawPointValues[types_1.ArtifactRarity.Epic].toNumber(),
        [types_1.ArtifactRarity.Legendary]: rawPointValues[types_1.ArtifactRarity.Legendary].toNumber(),
        [types_1.ArtifactRarity.Mythic]: rawPointValues[types_1.ArtifactRarity.Mythic].toNumber(),
    };
}
exports.decodeArtifactPointValues = decodeArtifactPointValues;
/**
 * Converts the raw typechain result of `ArtifactTypes.ArtifactWithMetadata`
 * struct to an `Artifact` typescript typed object (see @darkforest_eth/types).
 *
 * @param rawArtifactWithMetadata Raw data of an `ArtifactWithMetadata` struct,
 * returned from a blockchain call (assumed to be typed with typechain).
 */
function decodeArtifact(rawArtifactWithMetadata) {
    const { artifact, owner, upgrade, timeDelayedUpgrade, locationId, voyageId } = rawArtifactWithMetadata;
    return {
        isInititalized: artifact.isInitialized,
        id: artifactIdFromEthersBN(artifact.id),
        planetDiscoveredOn: (0, location_1.locationIdFromDecStr)(artifact.planetDiscoveredOn.toString()),
        rarity: artifact.rarity,
        planetBiome: artifact.planetBiome,
        mintedAtTimestamp: artifact.mintedAtTimestamp.toNumber(),
        discoverer: (0, address_1.address)(artifact.discoverer),
        artifactType: artifact.artifactType,
        activations: artifact.activations.toNumber(),
        lastActivated: artifact.lastActivated.toNumber(),
        lastDeactivated: artifact.lastDeactivated.toNumber(),
        controller: (0, address_1.address)(artifact.controller),
        wormholeTo: artifact.wormholeTo.eq(0) ? undefined : (0, location_1.locationIdFromEthersBN)(artifact.wormholeTo),
        currentOwner: (0, address_1.address)(owner),
        upgrade: (0, upgrade_1.decodeUpgrade)(upgrade),
        timeDelayedUpgrade: (0, upgrade_1.decodeUpgrade)(timeDelayedUpgrade),
        onPlanetId: locationId.eq(0) ? undefined : (0, location_1.locationIdFromEthersBN)(locationId),
        onVoyageId: voyageId.eq(0) ? undefined : voyageId.toString(),
    };
}
exports.decodeArtifact = decodeArtifact;
//# sourceMappingURL=artifact.js.map