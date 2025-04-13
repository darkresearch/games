import type { Biome } from './game_types';
import type { ArtifactId, EthAddress, LocationId, VoyageId } from './identifier';
import type { TransactionCollection } from './transaction';
import type { Upgrade } from './upgrade';
import type { Abstract } from './utility';
/**
 * Abstract type representing an artifact type.
 */
export declare type ArtifactType = Abstract<number, 'ArtifactType'>;
/**
 * Enumeration of artifact types.
 */
export declare const ArtifactType: {
    readonly Unknown: ArtifactType;
    readonly Monolith: ArtifactType;
    readonly Colossus: ArtifactType;
    readonly Spaceship: ArtifactType;
    readonly Pyramid: ArtifactType;
    readonly Wormhole: ArtifactType;
    readonly PlanetaryShield: ArtifactType;
    readonly PhotoidCannon: ArtifactType;
    readonly BloomFilter: ArtifactType;
    readonly BlackDomain: ArtifactType;
    readonly ShipMothership: ArtifactType;
    readonly ShipCrescent: ArtifactType;
    readonly ShipWhale: ArtifactType;
    readonly ShipGear: ArtifactType;
    readonly ShipTitan: ArtifactType;
};
/**
 * Mapping from ArtifactType to pretty-printed names.
 */
export declare const ArtifactTypeNames: {
    readonly [x: number]: "Unknown" | "Monolith" | "Colossus" | "Spaceship" | "Pyramid" | "Wormhole" | "Planetary Shield" | "Black Domain" | "Photoid Cannon" | "Bloom Filter" | "Mothership" | "Crescent" | "Whale" | "Gear" | "Titan";
};
/**
 * Abstract type representing an artifact rarity level.
 */
export declare type ArtifactRarity = Abstract<number, 'ArtifactRarity'>;
/**
 * Enumeration of artifact rarity levels. Common = 1, Mythic = 5
 */
export declare const ArtifactRarity: {
    readonly Unknown: ArtifactRarity;
    readonly Common: ArtifactRarity;
    readonly Rare: ArtifactRarity;
    readonly Epic: ArtifactRarity;
    readonly Legendary: ArtifactRarity;
    readonly Mythic: ArtifactRarity;
};
/**
 * Mapping from ArtifactRarity to pretty-printed names.
 */
export declare const ArtifactRarityNames: {
    readonly [x: number]: "Unknown" | "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
};
/**
 * mapping from ArtifactRarity to points earned for finding this artifact.
 */
export declare type ArtifactPointValues = {
    [ArtifactRarity: number]: number;
};
/**
 * Represents data associated with a Dark Forest artifact NFT. Note
 * that some `Artifact` fields store client-specific data that the blockchain is
 * not aware of, such as `unconfirmedDepositArtifact` (tracks pending
 * depositArtifact transaction that involves this artifact). If you're using a
 * client that can't send transactions, these fields should be ignored.
 */
export declare type Artifact = {
    isInititalized: boolean;
    id: ArtifactId;
    planetDiscoveredOn: LocationId;
    rarity: ArtifactRarity;
    planetBiome: Biome;
    mintedAtTimestamp: number;
    discoverer: EthAddress;
    artifactType: ArtifactType;
    activations: number;
    lastActivated: number;
    lastDeactivated: number;
    controller: EthAddress;
    upgrade: Upgrade;
    timeDelayedUpgrade: Upgrade;
    currentOwner: EthAddress;
    wormholeTo?: LocationId;
    onPlanetId?: LocationId;
    onVoyageId?: VoyageId;
    transactions?: TransactionCollection;
};
/**
 * Deterministically generates the name of the artifact from its ID.
 *
 * @param artifact The artifact to generate a name for
 */
export declare function artifactNameFromArtifact(artifact: Artifact): string;
/**
 * type interface for ERC721 metadata.
 */
declare type NFTAttribute = {
    trait_type: string;
    value: string | number;
    display_type?: string;
};
export declare type NFTMetadata = {
    name: string;
    description: string;
    image: string;
    attributes: NFTAttribute[];
};
export interface RenderedArtifact extends Partial<Artifact> {
    artifactType: ArtifactType;
    planetBiome: Biome;
    rarity: ArtifactRarity;
    id: ArtifactId;
}
export declare type Wormhole = {
    from: LocationId;
    to: LocationId;
};
export {};
