"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.artifactNameFromArtifact = exports.ArtifactRarityNames = exports.ArtifactRarity = exports.ArtifactTypeNames = exports.ArtifactType = void 0;
/**
 * Enumeration of artifact types.
 */
exports.ArtifactType = {
    Unknown: 0,
    Monolith: 1,
    Colossus: 2,
    Spaceship: 3,
    Pyramid: 4,
    Wormhole: 5,
    PlanetaryShield: 6,
    PhotoidCannon: 7,
    BloomFilter: 8,
    BlackDomain: 9,
    ShipMothership: 10,
    ShipCrescent: 11,
    ShipWhale: 12,
    ShipGear: 13,
    ShipTitan: 14,
    // Don't forget to update MIN_ARTIFACT_TYPE and/or MAX_ARTIFACT_TYPE in the `constants` package
};
/**
 * Mapping from ArtifactType to pretty-printed names.
 */
exports.ArtifactTypeNames = {
    [exports.ArtifactType.Unknown]: 'Unknown',
    [exports.ArtifactType.Monolith]: 'Monolith',
    [exports.ArtifactType.Colossus]: 'Colossus',
    [exports.ArtifactType.Spaceship]: 'Spaceship',
    [exports.ArtifactType.Pyramid]: 'Pyramid',
    [exports.ArtifactType.Wormhole]: 'Wormhole',
    [exports.ArtifactType.PlanetaryShield]: 'Planetary Shield',
    [exports.ArtifactType.BlackDomain]: 'Black Domain',
    [exports.ArtifactType.PhotoidCannon]: 'Photoid Cannon',
    [exports.ArtifactType.BloomFilter]: 'Bloom Filter',
    [exports.ArtifactType.ShipMothership]: 'Mothership',
    [exports.ArtifactType.ShipCrescent]: 'Crescent',
    [exports.ArtifactType.ShipWhale]: 'Whale',
    [exports.ArtifactType.ShipGear]: 'Gear',
    [exports.ArtifactType.ShipTitan]: 'Titan',
};
/**
 * Enumeration of artifact rarity levels. Common = 1, Mythic = 5
 */
exports.ArtifactRarity = {
    Unknown: 0,
    Common: 1,
    Rare: 2,
    Epic: 3,
    Legendary: 4,
    Mythic: 5,
    // Don't forget to update MIN_ARTIFACT_RARITY and/or MAX_ARTIFACT_RARITY in the `constants` package
};
/**
 * Mapping from ArtifactRarity to pretty-printed names.
 */
exports.ArtifactRarityNames = {
    [exports.ArtifactRarity.Unknown]: 'Unknown',
    [exports.ArtifactRarity.Common]: 'Common',
    [exports.ArtifactRarity.Rare]: 'Rare',
    [exports.ArtifactRarity.Epic]: 'Epic',
    [exports.ArtifactRarity.Legendary]: 'Legendary',
    [exports.ArtifactRarity.Mythic]: 'Mythic',
};
// TODO: get this out of here
const godGrammar = {
    god1: [
        "c'",
        'za',
        "ry'",
        "ab'",
        "bak'",
        "dt'",
        "ek'",
        "fah'",
        "q'",
        'qo',
        'van',
        'bow',
        'gui',
        'si',
    ],
    god2: [
        'thun',
        'tchalla',
        'thovo',
        'saron',
        'zoth',
        'sharrj',
        'thulu',
        'ra',
        'wer',
        'doin',
        'renstad',
        'nevere',
        'goth',
        'anton',
        'layton',
    ],
};
/**
 * Deterministically generates the name of the artifact from its ID.
 *
 * @param artifact The artifact to generate a name for
 */
function artifactNameFromArtifact(artifact) {
    const idNum = parseInt(artifact.id, 16);
    const roll1 = (idNum % 7919) % godGrammar.god1.length; // 7919 is a big prime
    const roll2 = (idNum % 7883) % godGrammar.god2.length; // 7883 is a big prime
    const name = godGrammar.god1[roll1] + godGrammar.god2[roll2];
    const nameCapitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return nameCapitalized;
}
exports.artifactNameFromArtifact = artifactNameFromArtifact;
//# sourceMappingURL=artifact.js.map