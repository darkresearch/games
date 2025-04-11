import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import type { Artifact, ArtifactId, ArtifactPointValues } from '@darkforest_eth/types';
import type { BigNumber as EthersBN } from 'ethers';
/**
 * Converts a possibly 0x-prefixed string of hex digits to an `ArtifactId`: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). ArtifactIDs should only be instantiated through
 * `artifactIdFromHexStr`, `artifactIdFromDecStr`, and `artifactIdFromEthersBN`.
 *
 * @param artifactId Possibly 0x-prefixed, possibly unpadded hex `string`
 * representation of an artifact's ID.
 */
export declare function artifactIdFromHexStr(artifactId: string): ArtifactId;
/**
 * Converts a string representing a decimal number into an ArtifactID: a
 * non-0x-prefixed all lowercase hex string of exactly 64 hex characters
 * (0-padded if necessary). ArtifactIDs should only be instantiated through
 * `artifactIdFromHexStr`, `artifactIdFromDecStr`, and `artifactIdFromEthersBN`.
 *
 * @param artifactId `string` of decimal digits, the base 10 representation of an
 * artifact ID.
 */
export declare function artifactIdFromDecStr(artifactId: string): ArtifactId;
/**
 * Converts a ethers.js BigNumber (type aliased here as EthersBN) representing a
 * decimal number into an ArtifactID: a non-0x-prefixed all lowercase hex string
 * of exactly 64 hex characters (0-padded if necessary). ArtifactIDs should only
 * be instantiated through `artifactIdFromHexStr`, `artifactIdFromDecStr`, and
 * `artifactIdFromEthersBN`.
 *
 * @param artifactId ether.js `BigNumber` representing artifact's ID
 */
export declare function artifactIdFromEthersBN(artifactId: EthersBN): ArtifactId;
/**
 * Converts an ArtifactID to a decimal string with equivalent numerical value;
 * can be used if you need to pass an artifact ID into a web3 call.
 *
 * @param artifactId non-0x-prefixed lowercase hex `string` of 64 hex characters
 * representing an artifact's ID
 */
export declare function artifactIdToDecStr(artifactId: ArtifactId): string;
export declare type RawArtifactPointValues = Awaited<ReturnType<DarkForest['getArtifactPointValues']>>;
/**
 * Converts the raw typechain result of a call to
 * `DarkForest.getArtifactPointValues` to an `ArtifactPointValues`
 * typescript typed object (see @darkforest_eth/types).
 */
export declare function decodeArtifactPointValues(rawPointValues: RawArtifactPointValues): ArtifactPointValues;
export declare type RawArtifactWithMetadata = Awaited<ReturnType<DarkForest['getArtifactById']>>;
/**
 * Converts the raw typechain result of `ArtifactTypes.ArtifactWithMetadata`
 * struct to an `Artifact` typescript typed object (see @darkforest_eth/types).
 *
 * @param rawArtifactWithMetadata Raw data of an `ArtifactWithMetadata` struct,
 * returned from a blockchain call (assumed to be typed with typechain).
 */
export declare function decodeArtifact(rawArtifactWithMetadata: RawArtifactWithMetadata): Artifact;
