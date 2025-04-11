"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodePlayer = void 0;
const address_1 = require("./address");
const location_1 = require("./location");
/**
 * Converts the raw typechain result of a call which fetches a
 * `PlayerTypes.Player` struct, and converts it into an object
 * with type `Player` (see @darkforest_eth/types) that can be used by a client.
 *
 * @param rawPlayer result of an ethers.js contract call which returns a raw
 * `PlayerTypes.Player` struct, typed with typechain.
 */
function decodePlayer(rawPlayer, rawArenaPlayer) {
    return {
        address: (0, address_1.address)(rawPlayer.player),
        initTimestamp: rawPlayer.initTimestamp.toNumber(),
        homePlanetId: (0, location_1.locationIdFromEthersBN)(rawPlayer.homePlanetId),
        lastRevealTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
        lastClaimTimestamp: rawPlayer.lastRevealTimestamp.toNumber(),
        score: rawPlayer.score.toNumber(),
        spaceJunk: rawPlayer.spaceJunk.toNumber(),
        spaceJunkLimit: rawPlayer.spaceJunkLimit.toNumber(),
        claimedShips: rawPlayer.claimedShips,
        moves: rawArenaPlayer.moves.toNumber(),
        team: rawArenaPlayer.team.toNumber(),
        ready: rawArenaPlayer.ready,
    };
}
exports.decodePlayer = decodePlayer;
//# sourceMappingURL=player.js.map