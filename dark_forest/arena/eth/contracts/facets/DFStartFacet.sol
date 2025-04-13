// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// Interface imports
import {IDiamondLoupe} from "../vendor/interfaces/IDiamondLoupe.sol";
import {IDiamondCut} from "../vendor/interfaces/IDiamondCut.sol";
import {IERC173} from "../vendor/interfaces/IERC173.sol";
import {IERC165} from "@solidstate/contracts/introspection/IERC165.sol";
import {IERC721} from "@solidstate/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol";
import {IERC721Enumerable} from "@solidstate/contracts/token/ERC721/enumerable/IERC721Enumerable.sol";

// Inherited storage
import {ERC721MetadataStorage} from "@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol";

// Library imports
import {LibDiamond} from "../vendor/libraries/LibDiamond.sol";
import {WithStorage} from "../libraries/LibStorage.sol";
import {WithArenaStorage} from "../libraries/LibArenaStorage.sol";
import {LibGameUtils} from "../libraries/LibGameUtils.sol";

// Contract imports
import {DFWhitelistFacet} from "./DFWhitelistFacet.sol";

// Type imports
import {PlanetDefaultStats, Upgrade, UpgradeBranch, Modifiers, Mod, ArenaCreateRevealPlanetArgs, Spaceships} from "../DFTypes.sol";

contract DFStartFacet is WithStorage, WithArenaStorage {
  event ArenaInitialized(address ownerAddress, address lobbyAddress);

  function start() public {
    gs().diamondAddress = address(this);

    ws().enabled = ai().auxArgs.allowListEnabled;
    uint256 allowedAddressesLength = ai().auxArgs.allowedAddresses.length;

    if (ws().enabled && allowedAddressesLength > 0) {
      // delegating call here because msg.sender must remain intact.
      (bool success, bytes memory returndata) = (address(this)).delegatecall(
        abi.encodeWithSignature(
          "bulkAddToWhitelist(address[])",
          ai().auxArgs.allowedAddresses
        )
      );
      require(success, "whitelisting ownership did not succeed");
    }

    ws().drip = 0.05 ether;

    gs().planetLevelsCount = 10;
    gs().planetLevelThresholds = ai().initArgs.PLANET_LEVEL_THRESHOLDS;

    snarkConstants().DISABLE_ZK_CHECKS = ai().initArgs.DISABLE_ZK_CHECKS;
    snarkConstants().PLANETHASH_KEY = ai().initArgs.PLANETHASH_KEY;
    snarkConstants().SPACETYPE_KEY = ai().initArgs.SPACETYPE_KEY;
    snarkConstants().BIOMEBASE_KEY = ai().initArgs.BIOMEBASE_KEY;
    snarkConstants().PERLIN_MIRROR_X = ai().initArgs.PERLIN_MIRROR_X;
    snarkConstants().PERLIN_MIRROR_Y = ai().initArgs.PERLIN_MIRROR_Y;
    snarkConstants().PERLIN_LENGTH_SCALE = ai().initArgs.PERLIN_LENGTH_SCALE;

    gameConstants().PLANET_LEVEL_THRESHOLDS = ai().initArgs.PLANET_LEVEL_THRESHOLDS;
    gameConstants().ADMIN_CAN_ADD_PLANETS = ai().initArgs.ADMIN_CAN_ADD_PLANETS;
    gameConstants().WORLD_RADIUS_LOCKED = ai().initArgs.WORLD_RADIUS_LOCKED;
    gameConstants().WORLD_RADIUS_MIN = ai().initArgs.WORLD_RADIUS_MIN;
    gameConstants().MAX_NATURAL_PLANET_LEVEL = ai()
      .initArgs
      .MAX_NATURAL_PLANET_LEVEL;
    gameConstants().TIME_FACTOR_HUNDREDTHS = ai()
      .initArgs
      .TIME_FACTOR_HUNDREDTHS;
    gameConstants().PERLIN_THRESHOLD_1 = ai().initArgs.PERLIN_THRESHOLD_1;
    gameConstants().PERLIN_THRESHOLD_2 = ai().initArgs.PERLIN_THRESHOLD_2;
    gameConstants().PERLIN_THRESHOLD_3 = ai().initArgs.PERLIN_THRESHOLD_3;
    gameConstants().INIT_PERLIN_MIN = ai().initArgs.INIT_PERLIN_MIN;
    gameConstants().INIT_PERLIN_MAX = ai().initArgs.INIT_PERLIN_MAX;
    gameConstants().SPAWN_RIM_AREA = ai().initArgs.SPAWN_RIM_AREA;
    gameConstants().BIOME_THRESHOLD_1 = ai().initArgs.BIOME_THRESHOLD_1;
    gameConstants().BIOME_THRESHOLD_2 = ai().initArgs.BIOME_THRESHOLD_2;
    gameConstants().PLANET_RARITY = ai().initArgs.PLANET_RARITY;
    gameConstants().PLANET_TRANSFER_ENABLED = ai()
      .initArgs
      .PLANET_TRANSFER_ENABLED;
    gameConstants().PHOTOID_ACTIVATION_DELAY = ai()
      .initArgs
      .PHOTOID_ACTIVATION_DELAY;
    gameConstants().LOCATION_REVEAL_COOLDOWN = ai()
      .initArgs
      .LOCATION_REVEAL_COOLDOWN;
    gameConstants().PLANET_TYPE_WEIGHTS = ai().initArgs.PLANET_TYPE_WEIGHTS;
    gameConstants().SILVER_SCORE_VALUE = ai().initArgs.SILVER_SCORE_VALUE;
    gameConstants().ARTIFACT_POINT_VALUES = ai().initArgs.ARTIFACT_POINT_VALUES;
    // Space Junk
    gameConstants().SPACE_JUNK_ENABLED = ai().initArgs.SPACE_JUNK_ENABLED;
    gameConstants().SPACE_JUNK_LIMIT = ai().initArgs.SPACE_JUNK_LIMIT;
    gameConstants().PLANET_LEVEL_JUNK = ai().initArgs.PLANET_LEVEL_JUNK;
    gameConstants().ABANDON_SPEED_CHANGE_PERCENT = ai()
      .initArgs
      .ABANDON_SPEED_CHANGE_PERCENT;
    gameConstants().ABANDON_RANGE_CHANGE_PERCENT = ai()
      .initArgs
      .ABANDON_RANGE_CHANGE_PERCENT;
    // Capture Zones
    gameConstants().GAME_START_BLOCK = block.number;
    gameConstants().CAPTURE_ZONES_ENABLED = ai().initArgs.CAPTURE_ZONES_ENABLED;
    gameConstants().CAPTURE_ZONE_COUNT = ai().initArgs.CAPTURE_ZONE_COUNT;
    gameConstants().CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL = ai()
      .initArgs
      .CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL;
    gameConstants().CAPTURE_ZONE_RADIUS = ai().initArgs.CAPTURE_ZONE_RADIUS;
    gameConstants().CAPTURE_ZONE_PLANET_LEVEL_SCORE = ai()
      .initArgs
      .CAPTURE_ZONE_PLANET_LEVEL_SCORE;
    gameConstants().CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED = ai()
      .initArgs
      .CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED;
    gameConstants().CAPTURE_ZONES_PER_5000_WORLD_RADIUS = ai()
      .initArgs
      .CAPTURE_ZONES_PER_5000_WORLD_RADIUS;

    gs().nextChangeBlock =
      block.number +
      ai().initArgs.CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL;

    gs().worldRadius = ai().initArgs.WORLD_RADIUS_MIN; // will be overridden by `LibGameUtils.updateWorldRadius()` if !WORLD_RADIUS_LOCKED

    gs().paused = ai().initArgs.START_PAUSED || ai().initArgs.CONFIRM_START;

    gs().TOKEN_MINT_END_TIMESTAMP = ai().initArgs.TOKEN_MINT_END_TIMESTAMP;

    gs().initializedPlanetCountByLevel = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (uint256 i = 0; i < gs().planetLevelThresholds.length; i += 1) {
      gs().cumulativeRarities.push(
        (2**24 / gs().planetLevelThresholds[i]) * ai().initArgs.PLANET_RARITY
      );
    }

    //arenaMode initialization
    arenaStorage().gameover = false;
    arenaConstants().TARGET_PLANETS = ai().initArgs.TARGET_PLANETS;
    arenaConstants().CLAIM_VICTORY_ENERGY_PERCENT = ai()
      .initArgs
      .CLAIM_VICTORY_ENERGY_PERCENT;
    arenaConstants().MANUAL_SPAWN = ai().initArgs.MANUAL_SPAWN;
    arenaConstants().RANDOM_ARTIFACTS = ai().initArgs.RANDOM_ARTIFACTS;

    arenaConstants().MODIFIERS.popCap = ai().initArgs.MODIFIERS[
      uint256(Mod.popCap)
    ];
    arenaConstants().MODIFIERS.popGrowth = ai().initArgs.MODIFIERS[
      uint256(Mod.popGrowth)
    ];
    arenaConstants().MODIFIERS.silverCap = ai().initArgs.MODIFIERS[
      uint256(Mod.silverCap)
    ];
    arenaConstants().MODIFIERS.silverGrowth = ai().initArgs.MODIFIERS[
      uint256(Mod.silverGrowth)
    ];
    arenaConstants().MODIFIERS.range = ai().initArgs.MODIFIERS[
      uint256(Mod.range)
    ];
    arenaConstants().MODIFIERS.speed = ai().initArgs.MODIFIERS[
      uint256(Mod.speed)
    ];
    arenaConstants().MODIFIERS.defense = ai().initArgs.MODIFIERS[
      uint256(Mod.defense)
    ];
    arenaConstants().MODIFIERS.barbarianPercentage = ai().initArgs.MODIFIERS[
      uint256(Mod.barbarianPercentage)
    ];

    arenaConstants().SPACESHIPS = Spaceships(
      ai().initArgs.SPACESHIPS[0],
      ai().initArgs.SPACESHIPS[1],
      ai().initArgs.SPACESHIPS[2],
      ai().initArgs.SPACESHIPS[3],
      ai().initArgs.SPACESHIPS[4]
    );

    arenaConstants().NO_ADMIN = ai().initArgs.NO_ADMIN;
    arenaConstants().CONFIG_HASH = keccak256(abi.encode(ai().initArgs));
    arenaConstants().CONFIRM_START = ai().initArgs.CONFIRM_START;
    arenaConstants().START_PAUSED = ai().initArgs.START_PAUSED;

    uint256 initLength = ai().initArgs.INIT_PLANETS.length;

    /* each planet costs about 50k gas */
    for (uint256 i = 0; i < initLength; i++) {
      ArenaCreateRevealPlanetArgs memory initPlanet = ai()
        .initArgs
        .INIT_PLANETS[i];

      bytes32 initHash = LibGameUtils._hashInitPlanet(initPlanet);

      arenaStorage().initPlanetHashes[initHash] = true;

      /* Store planet ids for retrieval later */
      arenaConstants().INIT_PLANET_HASHES.push(initHash);
    }

    arenaConstants().TARGETS_REQUIRED_FOR_VICTORY = ai()
      .initArgs
      .TARGETS_REQUIRED_FOR_VICTORY;
    arenaConstants().BLOCK_MOVES = ai().initArgs.BLOCK_MOVES;
    arenaConstants().BLOCK_CAPTURE = ai().initArgs.BLOCK_CAPTURE;
    arenaConstants().TEAMS_ENABLED = ai().initArgs.TEAMS_ENABLED;
    arenaConstants().NUM_TEAMS = ai().initArgs.NUM_TEAMS;
    arenaConstants().RANKED = ai().initArgs.RANKED;

    initializeDefaults();
    initializeUpgrades();
    LibGameUtils.updateWorldRadius();

    emit ArenaInitialized(IERC173(address(this)).owner(), address(this));
  }

  function initializeDefaults() public {
    PlanetDefaultStats[] storage planetDefaultStats = planetDefaultStats();
    require(
      ((75 * arenaConstants().MODIFIERS.speed) / 100) > 0,
      "cannot initialize planets with 0 speed"
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Asteroid",
        populationCap: (100000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (417 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (99 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (400 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (0 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (0 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: 0
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Brown Dwarf",
        populationCap: (400000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (833 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (177 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (400 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (56 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (100000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (1 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Red Dwarf",
        populationCap: (1600000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (1250 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (315 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (300 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (167 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (500000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (2 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "White Dwarf",
        populationCap: (6000000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (1667 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (591 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (300 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (417 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (2500000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (3 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Yellow Star",
        populationCap: (25000000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (2083 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (1025 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (300 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (833 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (12000000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (4 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Blue Star",
        populationCap: (100000000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (2500 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (1734 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (200 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (1667 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (50000000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (5 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Giant",
        populationCap: (300000000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (2917 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (2838 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (200 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (2778 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (100000000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (7 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Supergiant",
        populationCap: (500000000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (3333 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (4414 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (200 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (2778 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (200000000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (10 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Unlabeled1",
        populationCap: (700000000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (3750 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (6306 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (200 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (2778 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (300000000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (20 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );

    planetDefaultStats.push(
      PlanetDefaultStats({
        label: "Unlabeled2",
        populationCap: (800000000 * arenaConstants().MODIFIERS.popCap) / 100,
        populationGrowth: (4167 * arenaConstants().MODIFIERS.popGrowth) / 100,
        range: (8829 * arenaConstants().MODIFIERS.range) / 100,
        speed: (75 * arenaConstants().MODIFIERS.speed) / 100,
        defense: (200 * arenaConstants().MODIFIERS.defense) / 100,
        silverGrowth: (2778 * arenaConstants().MODIFIERS.silverGrowth) / 100,
        silverCap: (400000000 * arenaConstants().MODIFIERS.silverCap) / 100,
        barbarianPercentage: (25 *
          arenaConstants().MODIFIERS.barbarianPercentage) / 100
      })
    );
  }

  function initializeUpgrades() public {
    Upgrade[4][3] storage upgrades = upgrades();

    // defense
    upgrades[uint256(UpgradeBranch.DEFENSE)][0] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 100,
      defMultiplier: 120
    });
    upgrades[uint256(UpgradeBranch.DEFENSE)][1] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 100,
      defMultiplier: 120
    });
    upgrades[uint256(UpgradeBranch.DEFENSE)][2] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 100,
      defMultiplier: 120
    });
    upgrades[uint256(UpgradeBranch.DEFENSE)][3] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 100,
      defMultiplier: 120
    });

    // range
    upgrades[uint256(UpgradeBranch.RANGE)][0] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 125,
      speedMultiplier: 100,
      defMultiplier: 100
    });
    upgrades[uint256(UpgradeBranch.RANGE)][1] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 125,
      speedMultiplier: 100,
      defMultiplier: 100
    });
    upgrades[uint256(UpgradeBranch.RANGE)][2] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 125,
      speedMultiplier: 100,
      defMultiplier: 100
    });
    upgrades[uint256(UpgradeBranch.RANGE)][3] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 125,
      speedMultiplier: 100,
      defMultiplier: 100
    });

    // speed
    upgrades[uint256(UpgradeBranch.SPEED)][0] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 175,
      defMultiplier: 100
    });
    upgrades[uint256(UpgradeBranch.SPEED)][1] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 175,
      defMultiplier: 100
    });
    upgrades[uint256(UpgradeBranch.SPEED)][2] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 175,
      defMultiplier: 100
    });
    upgrades[uint256(UpgradeBranch.SPEED)][3] = Upgrade({
      popCapMultiplier: 120,
      popGroMultiplier: 120,
      rangeMultiplier: 100,
      speedMultiplier: 175,
      defMultiplier: 100
    });
  }
}
