// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// Library imports
import {LibDiamond} from "../vendor/libraries/LibDiamond.sol";
import {LibGameUtils} from "../libraries/LibGameUtils.sol";
import {LibPlanet} from "../libraries/LibPlanet.sol";

// Contract imports
import {Diamond} from "../vendor/Diamond.sol";
import {DFWhitelistFacet} from "../facets/DFWhitelistFacet.sol";
import {DFCoreFacet} from "../facets/DFCoreFacet.sol";

// Interface imports
import {IDiamondCut} from "../vendor/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../vendor/interfaces/IDiamondLoupe.sol";
import {IERC173} from "../vendor/interfaces/IERC173.sol";

// Storage imports
import {WithStorage} from "../libraries/LibStorage.sol";
import {WithArenaStorage, ArenaStorage, ArenaPlanetInfo, ArenaConstants} from "../libraries/LibArenaStorage.sol";
import {Planet, PlanetExtendedInfo, PlanetExtendedInfo2, PlanetEventMetadata, PlanetDefaultStats, Player, SpaceType, Artifact, ArtifactType, DFPInitPlanetArgs, ArenaPlanetInfo, ArenaPlayerInfo, ArenaCreateRevealPlanetArgs} from "../DFTypes.sol";

contract DFArenaCoreFacet is WithStorage, WithArenaStorage {
    event AdminPlanetCreated(uint256 loc);
    event Gameover(address winner);
    event TargetCaptured(uint256 loc, address player);
    event PlayerInitialized(address player, uint256 loc);
    event LocationRevealed(address revealer, uint256 loc, uint256 x, uint256 y);
    event GameStarted(address startPlayer, uint256 startTime);
    event PlayerReady(address player, uint256 time);
    event PlayerNotReady(address player, uint256 time);
    event PauseStateChanged(bool paused);

    modifier onlyAdmin() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    modifier notPaused() {
        require(!gs().paused, "Game is paused");
        _;
    }

    modifier onlyWhitelisted() {
        require(
            DFWhitelistFacet(address(this)).isWhitelisted(msg.sender) ||
                msg.sender == LibDiamond.contractOwner(),
            "Player is not whitelisted"
        );
        _;
    }

    modifier targetPlanetsActive() {
        require(arenaConstants().TARGET_PLANETS, "target planets are disabled");
        _;
    }

    // True if init planet
    function isInitPlanet(ArenaCreateRevealPlanetArgs memory _initPlanetArgs)
        public
        view
        returns (bool)
    {
        return arenaStorage().initPlanetHashes[LibGameUtils._hashInitPlanet(_initPlanetArgs)];
    }

    // FUNCTIONS TO REPLACE on core DF Diamond
    function initializePlayer(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[8] memory _input,
        uint256 team
    ) public onlyWhitelisted returns (uint256) {
        uint256 _location = _input[0];
        uint256 _perlin = _input[1];
        uint256 _radius = _input[2];

        if (arenaConstants().MANUAL_SPAWN) {
            require(
                arenaStorage().arenaPlanetInfo[_location].spawnPlanet,
                "Planet is not a spawn planet"
            );

            Planet storage _planet = gs().planets[_location];
            PlanetExtendedInfo storage _planetExtendedInfo = gs().planetsExtendedInfo[_location];

            require(_planetExtendedInfo.isInitialized, "Planet not initialized");
            require(_planet.owner == address(0), "Planet is owned");
            require(!_planet.isHomePlanet, "Planet is already a home planet");

            _planet.isHomePlanet = true;
            _planet.owner = msg.sender;
            _planet.population = (_planet.populationCap * 99) / 100;
            _planetExtendedInfo.lastUpdated = block.timestamp;
        } else {
            LibPlanet.initializePlanet(_a, _b, _c, _input, true);
        }

        if (arenaConstants().TEAMS_ENABLED) {
            require(team <= arenaConstants().NUM_TEAMS, "invalid team");
            require(team > 0, "team cannot be 0");

            arenaStorage().arenaPlayerInfo[msg.sender].team = team;
            arenaStorage().teams[team].push(msg.sender);
        }

        // Checks player hasn't already initialized and confirms PERLIN.
        require(LibPlanet.checkPlayerInit(_location, _perlin, _radius));

        // Initialize player data
        gs().playerIds.push(msg.sender);
        gs().players[msg.sender] = Player(
            true,
            msg.sender,
            block.timestamp,
            _location,
            0,
            0,
            0,
            gameConstants().SPACE_JUNK_LIMIT,
            false
        );

        LibGameUtils.updateWorldRadius();
        emit PlayerInitialized(msg.sender, _location);
        return _location;
    }

    function claimVictory() public onlyWhitelisted notPaused {
        require(!arenaStorage().gameover, "cannot claim victory when game is over");

        require(_checkGameOver(), "victory condition not met");

        if (arenaConstants().TEAMS_ENABLED) {
            ArenaPlayerInfo memory player = arenaStorage().arenaPlayerInfo[msg.sender];
            uint256 winningTeam = player.team;
            arenaStorage().winners = arenaStorage().teams[winningTeam];
        } else {
            arenaStorage().winners.push(msg.sender);
        }
        arenaStorage().gameover = true;
        arenaStorage().endTime = block.timestamp;
        gs().paused = true;
        emit Gameover(msg.sender);
    }

    function createArenaPlanet(ArenaCreateRevealPlanetArgs memory args) public {
        require(gameConstants().ADMIN_CAN_ADD_PLANETS, "admin can no longer add planets");
        require(
            msg.sender == LibDiamond.contractOwner() || isInitPlanet(args),
            "must be admin or init planet"
        );

        if (args.requireValidLocationId) {
            require(LibGameUtils._locationIdValid(args.location), "Not a valid planet location");
        }

        if (args.isTargetPlanet) {
            require(arenaConstants().TARGET_PLANETS, "admin cannot create target planets");
            arenaStorage().targetPlanetIds.push(args.location);
        }
        if (args.isSpawnPlanet) {
            require(arenaConstants().MANUAL_SPAWN, "admin cannot create spawn planets");
            arenaStorage().spawnPlanetIds.push(args.location);
        }
        
        arenaStorage().arenaPlanetInfo[args.location] = ArenaPlanetInfo(
            args.isSpawnPlanet,
            args.isTargetPlanet,
            args.blockedPlanetIds
        );

        for(uint i = 0; i < args.blockedPlanetIds.length; i++) {
            arenaStorage().blocklist[args.location][args.blockedPlanetIds[i]] = true;
        }           
        

        SpaceType spaceType = LibGameUtils.spaceTypeFromPerlin(args.perlin);
        LibPlanet._initializePlanet(
            DFPInitPlanetArgs(
                args.location,
                args.perlin,
                args.level,
                gameConstants().TIME_FACTOR_HUNDREDTHS,
                spaceType,
                args.planetType,
                false
            )
        );

        gs().planetIds.push(args.location);
        gs().initializedPlanetCountByLevel[args.level] += 1;

        emit AdminPlanetCreated(args.location);
    }

    function arenaRevealLocation(ArenaCreateRevealPlanetArgs memory args)
        public
        onlyWhitelisted
        returns (uint256)
    {
        if (!gs().planetsExtendedInfo[args.location].isInitialized) {
            LibPlanet.initializePlanetWithDefaults(args.location, args.perlin, false);
        }

        LibPlanet.revealLocation(
            args.location,
            args.perlin,
            args.x,
            args.y,
            /* if this is true, check timestamp for reveal. We want false for admin / init planets */
            !(msg.sender == LibDiamond.contractOwner() || isInitPlanet(args)) // !initPlanetExistsOrAdmin(location)
        );
        emit LocationRevealed(msg.sender, args.location, args.x, args.y);
    }

    function bulkCreatePlanet(ArenaCreateRevealPlanetArgs[] memory planets) public onlyAdmin {
        for (uint256 i = 0; i < planets.length; i++) {
            createArenaPlanet(planets[i]);
        }
    }

    /* should be only admin or init planet*/
    function createAndReveal(ArenaCreateRevealPlanetArgs memory createPlanetArgs) public {
        createArenaPlanet(createPlanetArgs);
        arenaRevealLocation(createPlanetArgs);
    }

    function bulkCreateAndReveal(ArenaCreateRevealPlanetArgs[] calldata createArgsList) public {
        for (uint256 i = 0; i < createArgsList.length; i++) {
            createAndReveal(createArgsList[i]);
        }
    }

    function ready() public {
        require(arenaConstants().CONFIRM_START, "confirm start not activated");
        require(gs().players[msg.sender].isInitialized, "player does not exist");
        require(!arenaStorage().arenaPlayerInfo[msg.sender].ready, "player already marked ready");
        arenaStorage().arenaPlayerInfo[msg.sender].ready = true;
        arenaStorage().arenaPlayerInfo[msg.sender].lastReadyTime = block.timestamp;

        emit PlayerReady(msg.sender, block.timestamp);

        // Players only initialize if they have a spawn planet
        uint256 numSpawnPlanets = arenaStorage().spawnPlanetIds.length;
        address[] memory playerIds = gs().playerIds;
        uint256 numPlayerIds = playerIds.length;

        // If all spawnPlanets are not occupied, return.
        if (numPlayerIds != numSpawnPlanets) return;

        // If any player is not ready, return.
        for (uint256 i = 0; i < numPlayerIds; i++) {
            if (!arenaStorage().arenaPlayerInfo[playerIds[i]].ready) return;
        }

        // If code execution arrives here, all players are ready.
        // Only start once.
        if (arenaStorage().startTime == 0) {
            gs().paused = false;
            emit PauseStateChanged(false);
            arenaStorage().startTime = block.timestamp;
            emit GameStarted(msg.sender, block.timestamp);
        }
    }

    function notReady() public {
        require(arenaConstants().CONFIRM_START, "confirm start not activated");
        require(
            arenaStorage().arenaPlayerInfo[msg.sender].ready,
            "player already marked not ready"
        );

        arenaStorage().arenaPlayerInfo[msg.sender].ready = false;
        emit PlayerNotReady(msg.sender, block.timestamp);
    }

    function _checkGameOver() public returns (bool) {
        require(arenaConstants().TARGET_PLANETS, "target planets are disabled");

        uint256[] memory targetPlanets = arenaStorage().targetPlanetIds;
        uint256 captured = 0;

        for (uint256 i = 0; i < targetPlanets.length; i++) {
            uint256 locationId = targetPlanets[i];
            LibPlanet.refreshPlanet(locationId);
            Planet memory planet = gs().planets[locationId];
            PlanetExtendedInfo memory planetExtendedInfo = gs().planetsExtendedInfo[locationId];

            bool myPlanet = planet.owner == msg.sender;

            if (arenaConstants().TEAMS_ENABLED) {
                myPlanet =
                    arenaStorage().arenaPlayerInfo[planet.owner].team ==
                    arenaStorage().arenaPlayerInfo[msg.sender].team;
            }

            uint256 playerHomePlanet = gs().players[msg.sender].homePlanetId;
            bool blocked = arenaStorage().blocklist[locationId][playerHomePlanet];

            if (
                !myPlanet ||
                (planet.population * 100) / planet.populationCap <
                arenaConstants().CLAIM_VICTORY_ENERGY_PERCENT ||
                (arenaConstants().BLOCK_CAPTURE && blocked)
            ) {
                continue;
            }

            captured += 1;
            if (captured >= arenaConstants().TARGETS_REQUIRED_FOR_VICTORY) return true;
        }

        return false;
    }
}
