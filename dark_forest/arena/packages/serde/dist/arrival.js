"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeArrival = void 0;
const constants_1 = require("@darkforest_eth/constants");
const address_1 = require("./address");
const artifact_1 = require("./artifact");
const location_1 = require("./location");
/**
 * Converts the raw typechain result of `ArrivalTypes.ArrivalData` struct to
 * to a `QueuedArrival` typescript typed object (see @darkforest_eth/types)
 *
 * @param rawArrival Raw data of a `ArrivalTypes.ArrivalData` struct,
 * returned from a blockchain call (assumed to be typed with typechain).
 */
function decodeArrival(rawArrival) {
    const arrival = {
        eventId: rawArrival.id.toString(),
        player: (0, address_1.address)(rawArrival.player),
        fromPlanet: (0, location_1.locationIdFromDecStr)(rawArrival.fromPlanet.toString()),
        toPlanet: (0, location_1.locationIdFromDecStr)(rawArrival.toPlanet.toString()),
        energyArriving: rawArrival.popArriving.toNumber() / constants_1.CONTRACT_PRECISION,
        silverMoved: rawArrival.silverMoved.toNumber() / constants_1.CONTRACT_PRECISION,
        departureTime: rawArrival.departureTime.toNumber(),
        arrivalTime: rawArrival.arrivalTime.toNumber(),
        distance: rawArrival.distance.toNumber(),
        artifactId: rawArrival.carriedArtifactId.eq(0)
            ? undefined
            : (0, artifact_1.artifactIdFromEthersBN)(rawArrival.carriedArtifactId),
        arrivalType: rawArrival.arrivalType,
    };
    return arrival;
}
exports.decodeArrival = decodeArrival;
//# sourceMappingURL=arrival.js.map