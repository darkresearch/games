"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerControlledSpaceships = exports.canDepositArtifact = exports.canWithdrawArtifact = exports.canActivateArtifact = exports.dateMintedAt = exports.getActiveBlackDomain = exports.artifactFileName = exports.setForceAncient = exports.isAncient = exports.artifactRoll = exports.ArtifactFileColor = exports.levelFromRarity = exports.artifactBiomeName = exports.rarityNameFromArtifact = exports.rarityName = exports.biomeName = exports.getArtifactDebugName = exports.getActivatedArtifact = exports.isActivated = exports.artifactAvailableTimestamp = exports.durationUntilArtifactAvailable = exports.hasStatBoost = exports.isSpaceShip = exports.isBasic = exports.isRelic = exports.RelicsList = void 0;
const constants_1 = require("@darkforest_eth/constants");
const serde_1 = require("@darkforest_eth/serde");
const types_1 = require("@darkforest_eth/types");
exports.RelicsList = [
    types_1.ArtifactType.Wormhole,
    types_1.ArtifactType.PlanetaryShield,
    types_1.ArtifactType.PhotoidCannon,
    types_1.ArtifactType.BloomFilter,
    types_1.ArtifactType.BlackDomain,
];
// relics are the forgotten technologies / the artifacts that you can talk to
function isRelic(type) {
    return types_1.ArtifactType.Wormhole <= type && type <= types_1.ArtifactType.BlackDomain;
}
exports.isRelic = isRelic;
function isBasic(type) {
    return types_1.ArtifactType.Monolith <= type && type <= types_1.ArtifactType.Pyramid;
}
exports.isBasic = isBasic;
function isSpaceShip(type) {
    return type !== undefined && type >= constants_1.MIN_SPACESHIP_TYPE && type <= constants_1.MAX_SPACESHIP_TYPE;
}
exports.isSpaceShip = isSpaceShip;
function hasStatBoost(type) {
    return (!isSpaceShip(type) &&
        type !== types_1.ArtifactType.BlackDomain &&
        type !== types_1.ArtifactType.BloomFilter &&
        type !== types_1.ArtifactType.Wormhole);
}
exports.hasStatBoost = hasStatBoost;
const artifactCooldownHoursMap = {
    [types_1.ArtifactType.Unknown]: 24,
    [types_1.ArtifactType.Monolith]: 0,
    [types_1.ArtifactType.Colossus]: 0,
    [types_1.ArtifactType.Spaceship]: 0,
    [types_1.ArtifactType.Pyramid]: 0,
    [types_1.ArtifactType.Wormhole]: 4,
    [types_1.ArtifactType.PlanetaryShield]: 4,
    [types_1.ArtifactType.PhotoidCannon]: 24,
    [types_1.ArtifactType.BloomFilter]: 24,
    [types_1.ArtifactType.BlackDomain]: 24,
};
const artifactIsAncientMap = new Map();
function durationUntilArtifactAvailable(artifact) {
    return artifactAvailableTimestamp(artifact) - Date.now();
}
exports.durationUntilArtifactAvailable = durationUntilArtifactAvailable;
function artifactAvailableTimestamp(artifact) {
    if (artifact.lastDeactivated === 0) {
        return Date.now();
    }
    const availableAtTimestampMs = artifact.lastDeactivated * 1000 +
        artifactCooldownHoursMap[artifact.artifactType] * 60 * 60 * 1000;
    return availableAtTimestampMs;
}
exports.artifactAvailableTimestamp = artifactAvailableTimestamp;
function isActivated(artifact) {
    if (artifact === undefined) {
        return false;
    }
    return artifact.lastActivated > artifact.lastDeactivated;
}
exports.isActivated = isActivated;
function getActivatedArtifact(artifacts) {
    return artifacts.find(isActivated);
}
exports.getActivatedArtifact = getActivatedArtifact;
function getArtifactDebugName(a) {
    if (!a) {
        return 'unknown artifact';
    }
    return a.id.substring(0, 8);
}
exports.getArtifactDebugName = getArtifactDebugName;
const biomeName = (biome) => types_1.BiomeNames[biome];
exports.biomeName = biomeName;
const rarityName = (rarity) => types_1.ArtifactRarityNames[rarity];
exports.rarityName = rarityName;
const rarityNameFromArtifact = (a) => (0, exports.rarityName)(a.rarity);
exports.rarityNameFromArtifact = rarityNameFromArtifact;
function artifactBiomeName(artifact) {
    if (isAncient(artifact))
        return 'Ancient';
    return (0, exports.biomeName)(artifact.planetBiome);
}
exports.artifactBiomeName = artifactBiomeName;
const levelFromRarity = (rarity) => {
    if (rarity === types_1.ArtifactRarity.Mythic)
        return types_1.PlanetLevel.NINE;
    else if (rarity === types_1.ArtifactRarity.Legendary)
        return types_1.PlanetLevel.SEVEN;
    else if (rarity === types_1.ArtifactRarity.Epic)
        return types_1.PlanetLevel.FIVE;
    else if (rarity === types_1.ArtifactRarity.Rare)
        return types_1.PlanetLevel.THREE;
    else
        return types_1.PlanetLevel.ONE;
};
exports.levelFromRarity = levelFromRarity;
const artifactFileNamesById = new Map();
exports.ArtifactFileColor = {
    BLUE: 0,
    APP_BACKGROUND: 1,
};
let forceAncient = undefined;
function artifactRoll(id) {
    return (0, serde_1.hashToInt)(id) % 256;
}
exports.artifactRoll = artifactRoll;
function isAncient(artifact) {
    if (forceAncient !== undefined)
        return forceAncient;
    if (isSpaceShip(artifact.artifactType))
        return false;
    const { id, planetBiome: biome } = artifact;
    if (artifactIsAncientMap.has(id)) {
        return artifactIsAncientMap.get(id) || false;
    }
    let ancient = false;
    const roll = artifactRoll(id);
    if (biome === types_1.Biome.CORRUPTED)
        ancient = roll % 2 === 0;
    else
        ancient = roll % 16 === 0;
    artifactIsAncientMap.set(id, ancient);
    return ancient;
}
exports.isAncient = isAncient;
function setForceAncient(force) {
    forceAncient = force;
}
exports.setForceAncient = setForceAncient;
function artifactFileName(videoMode, thumb, artifact, color, 
// used in GifRenderer.ts to generate filenames from mock artifacts
debugProps = undefined) {
    const { artifactType: type, rarity, planetBiome: biome, id } = artifact;
    if (isSpaceShip(type)) {
        switch (type) {
            case types_1.ArtifactType.ShipWhale:
                return '64-whale.png';
            case types_1.ArtifactType.ShipMothership:
                return '64-mothership.png';
            case types_1.ArtifactType.ShipCrescent:
                return '64-crescent.png';
            case types_1.ArtifactType.ShipGear:
                return '64-gear.png';
            case types_1.ArtifactType.ShipTitan:
                return '64-titan.png';
        }
    }
    const size = thumb ? '16' : '64';
    const ext = videoMode ? 'webm' : 'png';
    let fileName = '';
    if (!debugProps?.skipCaching && artifactFileNamesById.has(id)) {
        fileName = artifactFileNamesById.get(id) || '';
    }
    else {
        const typeStr = types_1.ArtifactTypeNames[type];
        const rarityStr = types_1.ArtifactRarityNames[rarity];
        let nameStr = '';
        if (debugProps) {
            if (debugProps.forceAncient) {
                nameStr = 'ancient';
            }
            else {
                nameStr = biome + types_1.BiomeNames[biome];
            }
        }
        else {
            if (isAncient(artifact)) {
                nameStr = 'ancient';
            }
            else {
                nameStr = biome + types_1.BiomeNames[biome];
            }
        }
        fileName = `${typeStr}-${rarityStr}-${nameStr}`;
    }
    if (!debugProps?.skipCaching)
        artifactFileNamesById.set(id, fileName);
    let colorStr = '';
    if (color === exports.ArtifactFileColor.APP_BACKGROUND)
        colorStr = '-bg';
    return `${size}-${fileName}${colorStr}.${ext}`;
}
exports.artifactFileName = artifactFileName;
function getActiveBlackDomain(artifacts) {
    for (const artifact of artifacts) {
        if (artifact.artifactType === types_1.ArtifactType.BlackDomain && isActivated(artifact))
            return artifact;
    }
    return undefined;
}
exports.getActiveBlackDomain = getActiveBlackDomain;
const dateMintedAt = (artifact) => {
    if (!artifact)
        return '00/00/0000';
    return new Date(artifact.mintedAtTimestamp * 1000).toDateString();
};
exports.dateMintedAt = dateMintedAt;
function canActivateArtifact(artifact, planet, artifactsOnPlanet) {
    if (isSpaceShip(artifact.artifactType)) {
        return (planet &&
            planet.owner === constants_1.EMPTY_ADDRESS &&
            artifact.artifactType === types_1.ArtifactType.ShipCrescent &&
            artifact.activations === 0);
    }
    const available = artifactAvailableTimestamp(artifact);
    if (available !== undefined) {
        const now = Date.now();
        const anyArtifactActive = artifactsOnPlanet.some((a) => isActivated(a));
        const waitUntilAvailable = available - now;
        const availableToActivate = waitUntilAvailable <= -0 &&
            !anyArtifactActive &&
            planet?.locationId === artifact.onPlanetId &&
            !!artifact.onPlanetId;
        return availableToActivate;
    }
    return false;
}
exports.canActivateArtifact = canActivateArtifact;
function canWithdrawArtifact(account, artifact, planet) {
    return (planet &&
        !planet.destroyed &&
        planet.owner === account &&
        planet.planetType === types_1.PlanetType.TRADING_POST &&
        !isActivated(artifact) &&
        !isSpaceShip(artifact.artifactType));
}
exports.canWithdrawArtifact = canWithdrawArtifact;
function canDepositArtifact(account, artifact, planet) {
    return (planet &&
        !planet.destroyed &&
        planet.owner === account &&
        !artifact.onPlanetId &&
        planet.planetType === types_1.PlanetType.TRADING_POST);
}
exports.canDepositArtifact = canDepositArtifact;
function getPlayerControlledSpaceships(artifacts, owner) {
    if (!owner)
        return [];
    return (artifacts || []).filter((a) => a?.controller === owner);
}
exports.getPlayerControlledSpaceships = getPlayerControlledSpaceships;
//# sourceMappingURL=artifact.js.map