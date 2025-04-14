"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockLegendary = exports.mockEpic = exports.mockRare = exports.mockCommon = exports.mockArtifactWithRarity = exports.mockArtifact = exports.artifactName = void 0;
const constants_1 = require("@darkforest_eth/constants");
const types_1 = require("@darkforest_eth/types");
const namesById = new Map();
const artifactName = (artifact) => {
    if (!artifact)
        return 'Unknown';
    const myName = namesById.get(artifact.id);
    if (myName)
        return myName;
    const name = (0, types_1.artifactNameFromArtifact)(artifact);
    namesById.set(artifact.id, name);
    return name;
};
exports.artifactName = artifactName;
const randomHex = (len) => {
    let str = '';
    const chars = 'abcdef0123456789'.split('');
    while (str.length < len) {
        str = str + chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
};
const mockArtifact = (rarity, artifactType = types_1.ArtifactType.Spaceship, planetBiome = types_1.Biome.WASTELAND) => ({
    id: randomHex(64),
    planetDiscoveredOn: constants_1.EMPTY_LOCATION_ID,
    planetBiome,
    mintedAtTimestamp: Date.now(),
    discoverer: constants_1.EMPTY_ADDRESS,
    currentOwner: constants_1.EMPTY_ADDRESS,
    isInititalized: true,
    lastActivated: 0,
    lastDeactivated: 0,
    rarity: rarity,
    artifactType,
    upgrade: {
        energyCapMultiplier: 120,
        energyGroMultiplier: 100,
        rangeMultiplier: 100,
        speedMultiplier: 85,
        defMultiplier: 100,
    },
    onPlanetId: undefined,
});
exports.mockArtifact = mockArtifact;
const mockArtifactWithRarity = (rarity, artifactType = types_1.ArtifactType.Spaceship, planetBiome = types_1.Biome.WASTELAND) => (0, exports.mockArtifact)(rarity, artifactType, planetBiome);
exports.mockArtifactWithRarity = mockArtifactWithRarity;
exports.mockCommon = (0, exports.mockArtifactWithRarity)(types_1.ArtifactRarity.Common, types_1.ArtifactType.Spaceship, types_1.Biome.WASTELAND);
exports.mockRare = (0, exports.mockArtifactWithRarity)(types_1.ArtifactRarity.Rare, types_1.ArtifactType.Spaceship, types_1.Biome.WASTELAND);
exports.mockEpic = (0, exports.mockArtifactWithRarity)(types_1.ArtifactRarity.Epic, types_1.ArtifactType.Spaceship, types_1.Biome.WASTELAND);
exports.mockLegendary = (0, exports.mockArtifactWithRarity)(types_1.ArtifactRarity.Legendary, types_1.ArtifactType.Spaceship, types_1.Biome.WASTELAND);
//# sourceMappingURL=ArtifactProcgen.js.map