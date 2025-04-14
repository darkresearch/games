// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// Type imports
import {
    Planet, 
    PlanetExtendedInfo, 
    PlanetExtendedInfo2, 
    PlanetEventMetadata, 
    PlanetDefaultStats, 
    Upgrade, 
    RevealedCoords, 
    Player, 
    ArrivalData, 
    Artifact,
    ArenaPlanetInfo,
    ArenaPlayerInfo,
    Modifiers,
    ArenaCreateRevealPlanetArgs,
    Spaceships,
    InitArgs,
    AuxiliaryArgs
} from "../DFTypes.sol";

/* Remember! Only add new storage variables at the end of structs !! */

struct TournamentStorage {
    address[] matches;
    uint256 numMatches;
}

struct Initializers {
    InitArgs initArgs;
    AuxiliaryArgs auxArgs;
}

struct ArenaStorage {
    address[] winners;
    bool gameover;
    mapping(uint256 => ArenaPlanetInfo) arenaPlanetInfo;
    uint256[] spawnPlanetIds;
    uint256[] targetPlanetIds;

    uint256 moveCap;
    mapping(address => ArenaPlayerInfo) arenaPlayerInfo;
    uint256 endTime;
    uint256 startTime;
    mapping(bytes32 => bool) initPlanetHashes;
    // Teams teamId => playerAddresses
    mapping(uint256 => address[]) teams;
    mapping(uint256 => mapping(uint256 => bool)) blocklist;
}

struct ArenaConstants {
    bool TARGET_PLANETS;
    bool MANUAL_SPAWN;

    bytes32 CONFIG_HASH;

    Modifiers MODIFIERS;
    Spaceships SPACESHIPS;
    uint256 CLAIM_VICTORY_ENERGY_PERCENT;

    bool RANDOM_ARTIFACTS;

    bool NO_ADMIN;
    bytes32 [] INIT_PLANET_HASHES; // This won't mess up Diamond storage
    bool CONFIRM_START;
    uint256 TARGETS_REQUIRED_FOR_VICTORY;
    bool BLOCK_MOVES;
    bool BLOCK_CAPTURE;
    bool START_PAUSED;
    bool TEAMS_ENABLED;
    uint256 NUM_TEAMS;
    bool RANKED;
}

library LibArenaStorage {
    // Storage are structs where the data gets updated throughout the lifespan of the game
    bytes32 constant ARENA_INITIALIZERS_POSITION = keccak256("darkforest.initializers.arena");
    bytes32 constant ARENA_STORAGE_POSITION = keccak256("darkforest.storage.arena");
    bytes32 constant ARENA_CONSTANTS_POSITION = keccak256("darkforest.constants.arena");
    bytes32 constant TOURNAMENT_STORAGE_POSITION = keccak256("darkforest.storage.tournament");


    function arenaStorage() internal pure returns (ArenaStorage storage gs) {
        bytes32 position = ARENA_STORAGE_POSITION;
        assembly {
            gs.slot := position
        }
    }

     function arenaConstants() internal pure returns (ArenaConstants storage gs) {
        bytes32 position = ARENA_CONSTANTS_POSITION;
        assembly {
            gs.slot := position
        }
    }

     function tournamentStorage() internal pure returns (TournamentStorage storage ts) {
        bytes32 position = TOURNAMENT_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }


     function arenaInitializers() internal pure returns (Initializers storage ai) {
        bytes32 position = ARENA_INITIALIZERS_POSITION;
        assembly {
            ai.slot := position
        }
    }
}

contract WithArenaStorage {
    function arenaStorage() internal pure returns (ArenaStorage storage) {
        return LibArenaStorage.arenaStorage();
    }
    function arenaConstants() internal pure returns (ArenaConstants storage) {
        return LibArenaStorage.arenaConstants();
    }
    
    function tournamentStorage() internal pure returns (TournamentStorage storage) {
        return LibArenaStorage.tournamentStorage();
    }

    function ai() internal pure returns (Initializers storage) {
        return LibArenaStorage.arenaInitializers();
    }
}
