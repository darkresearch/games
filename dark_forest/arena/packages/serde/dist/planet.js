"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodePlanetDefaults = exports.decodePlanet = void 0;
const constants_1 = require("@darkforest_eth/constants");
const hexgen_1 = require("@darkforest_eth/hexgen");
const address_1 = require("./address");
const location_1 = require("./location");
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
function decodePlanet(rawLocationId, rawPlanet, rawPlanetExtendedInfo, rawPlanetExtendedInfo2, rawPlanetArenaInfo) {
    const locationId = (0, location_1.locationIdFromDecStr)(rawLocationId.toString());
    const planet = {
        locationId: locationId,
        perlin: rawPlanetExtendedInfo.perlin.toNumber(),
        spaceType: rawPlanetExtendedInfo.spaceType,
        owner: (0, address_1.address)(rawPlanet.owner),
        hatLevel: rawPlanetExtendedInfo.hatLevel.toNumber(),
        planetLevel: rawPlanet.planetLevel.toNumber(),
        planetType: rawPlanet.planetType,
        isHomePlanet: rawPlanet.isHomePlanet,
        energyCap: rawPlanet.populationCap.toNumber() / constants_1.CONTRACT_PRECISION,
        energyGrowth: rawPlanet.populationGrowth.toNumber() / constants_1.CONTRACT_PRECISION,
        silverCap: rawPlanet.silverCap.toNumber() / constants_1.CONTRACT_PRECISION,
        silverGrowth: rawPlanet.silverGrowth.toNumber() / constants_1.CONTRACT_PRECISION,
        energy: rawPlanet.population.toNumber() / constants_1.CONTRACT_PRECISION,
        silver: rawPlanet.silver.toNumber() / constants_1.CONTRACT_PRECISION,
        range: rawPlanet.range.toNumber(),
        speed: rawPlanet.speed.toNumber(),
        defense: rawPlanet.defense.toNumber(),
        spaceJunk: rawPlanetExtendedInfo.spaceJunk.toNumber(),
        // metadata
        lastUpdated: rawPlanetExtendedInfo.lastUpdated.toNumber(),
        upgradeState: [
            rawPlanetExtendedInfo.upgradeState0.toNumber(),
            rawPlanetExtendedInfo.upgradeState1.toNumber(),
            rawPlanetExtendedInfo.upgradeState2.toNumber(),
        ],
        unconfirmedClearEmoji: false,
        unconfirmedAddEmoji: false,
        loadingServerState: false,
        needsServerRefresh: true,
        silverSpent: 0,
        coordsRevealed: false,
        isInContract: true,
        syncedWithContract: true,
        hasTriedFindingArtifact: rawPlanetExtendedInfo[9],
        prospectedBlockNumber: rawPlanetExtendedInfo.prospectedBlockNumber.eq(0)
            ? undefined
            : rawPlanetExtendedInfo.prospectedBlockNumber.toNumber(),
        destroyed: rawPlanetExtendedInfo[11],
        heldArtifactIds: [],
        bonus: (0, hexgen_1.bonusFromHex)(locationId),
        pausers: rawPlanetExtendedInfo2.pausers.toNumber(),
        invader: (0, address_1.address)(rawPlanetExtendedInfo2.invader),
        capturer: (0, address_1.address)(rawPlanetExtendedInfo2.capturer),
        invadeStartBlock: rawPlanetExtendedInfo2.invadeStartBlock.eq(0)
            ? undefined
            : rawPlanetExtendedInfo2.invadeStartBlock.toNumber(),
        isTargetPlanet: rawPlanetArenaInfo.targetPlanet,
        isSpawnPlanet: rawPlanetArenaInfo.spawnPlanet,
        blockedPlanetIds: rawPlanetArenaInfo.blockedPlanetIds.map(v => (0, location_1.locationIdFromDecStr)(v.toString())),
    };
    return planet;
}
exports.decodePlanet = decodePlanet;
/**
 * Converts the raw typechain result of a call which fetches a
 * `PlanetTypes.PlanetDefaultStats[]` array of structs, and converts it into
 * an object with type `PlanetDefaults` (see @darkforest_eth/types).
 *
 * @param rawDefaults result of a ethers.js contract call which returns a raw
 * `PlanetTypes.PlanetDefaultStats` struct, typed with typechain.
 */
function decodePlanetDefaults(rawDefaults) {
    return {
        populationCap: rawDefaults.map((x) => x[1].toNumber() / constants_1.CONTRACT_PRECISION),
        populationGrowth: rawDefaults.map((x) => x[2].toNumber() / constants_1.CONTRACT_PRECISION),
        range: rawDefaults.map((x) => x[3].toNumber()),
        speed: rawDefaults.map((x) => x[4].toNumber()),
        defense: rawDefaults.map((x) => x[5].toNumber()),
        silverGrowth: rawDefaults.map((x) => x[6].toNumber() / constants_1.CONTRACT_PRECISION),
        silverCap: rawDefaults.map((x) => x[7].toNumber() / constants_1.CONTRACT_PRECISION),
        barbarianPercentage: rawDefaults.map((x) => x[8].toNumber()),
    };
}
exports.decodePlanetDefaults = decodePlanetDefaults;
//# sourceMappingURL=planet.js.map