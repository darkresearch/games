// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// Library imports
import {LibDiamond} from "../vendor/libraries/LibDiamond.sol";
import {LibGameUtils} from "../libraries/LibGameUtils.sol";

// Contract imports
import {Diamond} from "../vendor/Diamond.sol";
import {DFWhitelistFacet} from "../facets/DFWhitelistFacet.sol";
import {DFCoreFacet} from "../facets/DFCoreFacet.sol";

// Interface imports
import {IDiamondCut} from "../vendor/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../vendor/interfaces/IDiamondLoupe.sol";
import {IERC173} from "../vendor/interfaces/IERC173.sol";

// Storage imports
import {WithStorage, GameConstants, SnarkConstants} from "../libraries/LibStorage.sol";
import {WithArenaStorage, ArenaStorage, ArenaConstants, TournamentStorage, Initializers} from "../libraries/LibArenaStorage.sol";

import {
    SpaceType, 
    DFPInitPlanetArgs, 
    AdminCreatePlanetArgs, 
    Artifact, 
    ArtifactType, 
    Player, 
    Planet, 
    PlanetType, 
    PlanetExtendedInfo, 
    PlanetExtendedInfo2,
    AuxiliaryArgs,
    ArenaPlanetInfo,
    ArenaPlayerInfo
} from "../DFTypes.sol";



struct GraphGameConstants {
    bool ADMIN_CAN_ADD_PLANETS;
    uint256 TOKEN_MINT_END_TIMESTAMP;
    bool WORLD_RADIUS_LOCKED;
    uint256 WORLD_RADIUS_MIN;
    uint256 MAX_NATURAL_PLANET_LEVEL;
    uint256 TIME_FACTOR_HUNDREDTHS; // speedup/slowdown game
    uint256 PERLIN_THRESHOLD_1;
    uint256 PERLIN_THRESHOLD_2;
    uint256 PERLIN_THRESHOLD_3;
    uint256 INIT_PERLIN_MIN;
    uint256 INIT_PERLIN_MAX;
    uint256 SPAWN_RIM_AREA;
    uint256 BIOME_THRESHOLD_1;
    uint256 BIOME_THRESHOLD_2;
    uint256[10] PLANET_LEVEL_THRESHOLDS;
    uint256 PLANET_RARITY;
    bool PLANET_TRANSFER_ENABLED;
    uint256 PHOTOID_ACTIVATION_DELAY;
    uint256 LOCATION_REVEAL_COOLDOWN;
    uint8[200] PLANET_TYPE_WEIGHTS; // spaceType (enum 0-3) -> planetLevel (0-9) -> planetType (enum 0-4)
    uint256 SILVER_SCORE_VALUE;
    uint256[6] ARTIFACT_POINT_VALUES;
    // Space Junk
    bool SPACE_JUNK_ENABLED;
    /**
      Total amount of space junk a player can take on.
      This can be overridden at runtime by updating
      this value for a specific player in storage.
    */
    uint256 SPACE_JUNK_LIMIT;
    /**
      The amount of junk that each level of planet
      gives the player when moving to it for the
      first time.
    */
    uint256[10] PLANET_LEVEL_JUNK;
    /**
      The speed boost a movement receives when abandoning
      a planet.
    */
    uint256 ABANDON_SPEED_CHANGE_PERCENT;
    /**
      The range boost a movement receives when abandoning
      a planet.
    */
    uint256 ABANDON_RANGE_CHANGE_PERCENT;
    // Capture Zones
    uint256 GAME_START_BLOCK;
    bool CAPTURE_ZONES_ENABLED;
    uint256 CAPTURE_ZONE_COUNT;
    uint256 CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL;
    uint256 CAPTURE_ZONE_RADIUS;
    uint256[10] CAPTURE_ZONE_PLANET_LEVEL_SCORE;
    uint256 CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED;
    uint256 CAPTURE_ZONES_PER_5000_WORLD_RADIUS;
}

struct GraphConstants {
    GraphGameConstants gc;
    SnarkConstants sc;
    ArenaConstants ac;
    AuxiliaryArgs ai;
}

contract DFArenaGetterFacet is WithStorage, WithArenaStorage {

    function targetPlanetIds(uint256 idx) public view returns (uint256) {
        return arenaStorage().targetPlanetIds[idx];
    }

    function spawnPlanetIds(uint256 idx) public view returns (uint256) {
        return arenaStorage().spawnPlanetIds[idx];
    }

    function planetsArenaInfo(uint256 key) public view returns (ArenaPlanetInfo memory) {
        return arenaStorage().arenaPlanetInfo[key];
    }
    
    function bulkGetPlanetsArenaInfoByIds(uint256[] calldata ids)
        public
        view
        returns (ArenaPlanetInfo[] memory ret)
    {
        ret = new ArenaPlanetInfo[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            ret[i] = arenaStorage().arenaPlanetInfo[ids[i]];
        }
    }
    
    function getNTargetPlanets() public view returns (uint256) {
        return arenaStorage().targetPlanetIds.length;
    }

    function getNSpawnPlanets() public view returns (uint256) {
        return arenaStorage().spawnPlanetIds.length;
    }

    function bulkGetTargetPlanetIds(uint256 startIdx, uint256 endIdx)
        public
        view
        returns (uint256[] memory ret)
    {
        // return slice of targetPlanetIds array from startIdx through endIdx - 1
        ret = new uint256[](endIdx - startIdx);
        for (uint256 i = startIdx; i < endIdx; i++) {
            ret[i - startIdx] = arenaStorage().targetPlanetIds[i];
        }
    }

    function isBlocked(uint256 dest, uint256 src) public view returns (bool) {
        return arenaStorage().blocklist[dest][src];
    }

    function bulkGetSpawnPlanetIds(uint256 startIdx, uint256 endIdx)
        public
        view
        returns (uint256[] memory ret)
    {
        // return slice of spawnPlanetIds array from startIdx through endIdx - 1
        ret = new uint256[](endIdx - startIdx);
        for (uint256 i = startIdx; i < endIdx; i++) {
            ret[i - startIdx] = arenaStorage().spawnPlanetIds[i];
        }
    }

    function arenaPlayers(address key) public view returns (ArenaPlayerInfo memory) {
        return arenaStorage().arenaPlayerInfo[key];
    }

    function bulkGetArenaPlayers(uint256 startIdx, uint256 endIdx)
        public
        view
        returns (ArenaPlayerInfo[] memory ret)
    {
        // return array of planets corresponding to planetIds[startIdx] through planetIds[endIdx - 1]
        ret = new ArenaPlayerInfo[](endIdx - startIdx);
        for (uint256 i = startIdx; i < endIdx; i++) {
            ret[i - startIdx] = arenaStorage().arenaPlayerInfo[gs().playerIds[i]];
        }
    }

    function getWinners() public view returns (address[] memory) {
        return arenaStorage().winners;
    }

    function getGameover() public view returns (bool) {
        return arenaStorage().gameover;
    }

    function getStartTime() public view returns (uint256) {
        return arenaStorage().startTime;
    }

    function getEndTime() public view returns (uint256) {
        return arenaStorage().endTime;
    }

    function getRoundDuration() public view returns (uint256) {
        if(arenaStorage().startTime == 0) {
            return 0;
        }
        if(arenaStorage().endTime == 0) {
            return block.timestamp - arenaStorage().startTime;
        }
        return arenaStorage().endTime - arenaStorage().startTime;
    }

    function getArenaConstants() public pure returns (ArenaConstants memory) {
        return arenaConstants();
    }

    function getMatches() public view returns (address[] memory) {
        return tournamentStorage().matches;
    }

    function getNumMatches() public view returns (uint256) {
        return tournamentStorage().numMatches;
    }

    function getMatch(uint256 id) public view returns (address) {
        return tournamentStorage().matches[id];
    }

    function getInitPlanetHashes() public view returns (bytes32[] memory) {
        bytes32[] memory initPlanetIds = arenaConstants().INIT_PLANET_HASHES;
        return initPlanetIds;
    }

    function getTeam(uint256 team) public view returns (address[] memory) {
        return arenaStorage().teams[team];
    }

    function getPlanetWeights1DArray() private pure returns(uint8[200] memory) {
        GameConstants memory gc = gameConstants();
        uint8 a = 4;
        uint8 b = 10;
        uint8 c = 5;
        uint8[5*10*4] memory weights;
        uint256 count = 0;
        for(uint8 i = 0; i < a; i++) {
            for(uint8 j = 0; j < b; j++) {
                for(uint8 k = 0; k < c; k++) {
                    weights[count++] = gc.PLANET_TYPE_WEIGHTS[i][j][k];
                }     
            }   
        }
        return weights;
    }


    function getGraphGameConstants() public view returns (GraphGameConstants memory) {
        GameConstants memory gc = gameConstants();

        GraphGameConstants memory g = GraphGameConstants({
            ADMIN_CAN_ADD_PLANETS: gc.ADMIN_CAN_ADD_PLANETS,
            TOKEN_MINT_END_TIMESTAMP: gs().TOKEN_MINT_END_TIMESTAMP,
            WORLD_RADIUS_LOCKED: gc.WORLD_RADIUS_LOCKED,
            WORLD_RADIUS_MIN: gc.WORLD_RADIUS_MIN,
            MAX_NATURAL_PLANET_LEVEL: gc.MAX_NATURAL_PLANET_LEVEL,
            TIME_FACTOR_HUNDREDTHS: gc.TIME_FACTOR_HUNDREDTHS, // speedup/slowdown game
            PERLIN_THRESHOLD_1: gc.PERLIN_THRESHOLD_1,
            PERLIN_THRESHOLD_2: gc.PERLIN_THRESHOLD_2,
            PERLIN_THRESHOLD_3: gc.PERLIN_THRESHOLD_3,
            INIT_PERLIN_MIN: gc.INIT_PERLIN_MIN,
            INIT_PERLIN_MAX: gc.INIT_PERLIN_MAX,
            SPAWN_RIM_AREA: gc.SPAWN_RIM_AREA,
            BIOME_THRESHOLD_1: gc.BIOME_THRESHOLD_1,
            BIOME_THRESHOLD_2: gc.BIOME_THRESHOLD_2,
            PLANET_LEVEL_THRESHOLDS: gc.PLANET_LEVEL_THRESHOLDS,
            PLANET_RARITY: gc.PLANET_RARITY,
            PLANET_TRANSFER_ENABLED: gc.PLANET_TRANSFER_ENABLED,
            PHOTOID_ACTIVATION_DELAY: gc.PHOTOID_ACTIVATION_DELAY,
            LOCATION_REVEAL_COOLDOWN: gc.LOCATION_REVEAL_COOLDOWN,
            PLANET_TYPE_WEIGHTS: getPlanetWeights1DArray(), // uint[8] 200 spaceType (enum 0-3) -> planetLevel (0-9) -> planetType (enum 0-4)
            SILVER_SCORE_VALUE: gc.SILVER_SCORE_VALUE,
            ARTIFACT_POINT_VALUES: gc.ARTIFACT_POINT_VALUES,
            // Space Junk
            SPACE_JUNK_ENABLED: gc.SPACE_JUNK_ENABLED,
            /**
            Total amount of space junk a player can take on.
            This can be overridden at runtime by updating
            this value for a specific player in storage.
            */
            SPACE_JUNK_LIMIT: gc.SPACE_JUNK_LIMIT,
            /**
            The amount of junk that each level of planet
            gives the player when moving to it for the
            first time.
            */
            PLANET_LEVEL_JUNK: gc.PLANET_LEVEL_JUNK,
            /**
            The speed boost a movement receives when abandoning
            a planet.
            */
            ABANDON_SPEED_CHANGE_PERCENT: gc.ABANDON_SPEED_CHANGE_PERCENT,
            /**
            The range boost a movement receives when abandoning
            a planet.
            */
            ABANDON_RANGE_CHANGE_PERCENT: gc.ABANDON_RANGE_CHANGE_PERCENT,
            // Capture Zones
            GAME_START_BLOCK: gc.GAME_START_BLOCK,
            CAPTURE_ZONES_ENABLED: gc.CAPTURE_ZONES_ENABLED,
            CAPTURE_ZONE_COUNT: gc.CAPTURE_ZONE_COUNT,
            CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL: gc.CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL,
            CAPTURE_ZONE_RADIUS: gc.CAPTURE_ZONE_RADIUS,
            CAPTURE_ZONE_PLANET_LEVEL_SCORE: gc.CAPTURE_ZONE_PLANET_LEVEL_SCORE,
            CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED: gc.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED,
            CAPTURE_ZONES_PER_5000_WORLD_RADIUS: gc.CAPTURE_ZONES_PER_5000_WORLD_RADIUS
        });

        return g;
    }

    // Constants for the Graph (no multi-dimensional arrays)
    function getGraphConstants() public view returns (GraphConstants memory) {
        GraphConstants memory constants = GraphConstants({
            gc: getGraphGameConstants(),
            sc: snarkConstants(),
            ac: arenaConstants(),
            ai: ai().auxArgs
        });
        return constants;
    }

    function getInitializers() public view returns (Initializers memory) {
        return Initializers({
            initArgs: ai().initArgs,
            auxArgs: ai().auxArgs
        });
    }
}
