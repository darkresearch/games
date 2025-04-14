import {
  DarkForest,
  DarkForest__arenaPlayersResultValue0Struct,
  DarkForest__getArenaConstantsResultValue0Struct,
  DarkForest__getGraphConstantsResultValue0Struct,
} from '../../generated/DarkForest/DarkForest';
import {
  Arena,
  ArenaConfig,
  ArenaPlanet,
  ArenaPlayer,
  Badge,
  Blocklist,
  ConfigPlayer,
  Player,
} from '../../generated/schema';
import { Address, BigInt, Bytes, dataSource, log } from '@graphprotocol/graph-ts';
import {
  bjjFieldElementToSignedInt,
  hexStringToPaddedUnprefixed,
  isDefenseBoosted,
  isEnergyCapBoosted,
  isEnergyGrowthBoosted,
  isRangeBoosted,
  isSpaceJunkHalved,
  isSpeedBoosted,
  toPlanetType,
  toSpaceType,
} from './converters';
import { MAX_INT_32 } from './constants';

export function arenaId(id: string): string {
  return `${dataSource.address().toHexString()}-${id}`;
}

export function configPlayerId(player: string, configHash: string): string {
  return `${player}-${configHash}`;
}
export function configTeamId(players: string[], configHash: string): string {
  return `${players.toString()}-${configHash}`;
}
/* 
  Standard id for arena: contract-id 
  ex Player: 0x124d0b48570adfd14ac35820e38db273caa6a694-0x1c0f0af3262a7213e59be7f1440282279d788335
*/
export function makeArenaId(contract: string, id: string): string {
  return `${contract}-${id}`;
}

export function buildConfig(
  arenaId: string,
  constants: DarkForest__getGraphConstantsResultValue0Struct
): ArenaConfig {
  const config = new ArenaConfig(arenaId);
  config.arena = arenaId;
  // Good to here
  config.ABANDON_RANGE_CHANGE_PERCENT = constants.gc.ABANDON_SPEED_CHANGE_PERCENT;
  config.ABANDON_SPEED_CHANGE_PERCENT = constants.gc.ABANDON_SPEED_CHANGE_PERCENT;
  config.ADMIN_CAN_ADD_PLANETS = constants.gc.ADMIN_CAN_ADD_PLANETS;
  config.ARTIFACT_POINT_VALUES = constants.gc.ARTIFACT_POINT_VALUES;
  config.BIOME_THRESHOLD_1 = constants.gc.BIOME_THRESHOLD_1;
  config.BIOME_THRESHOLD_2 = constants.gc.BIOME_THRESHOLD_2;
  config.BIOMEBASE_KEY = constants.sc.BIOMEBASE_KEY;
  config.BLOCK_CAPTURE = constants.ac.BLOCK_CAPTURE;
  config.BLOCK_MOVES = constants.ac.BLOCK_MOVES;
  config.CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL = constants.gc.CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL;
  config.CAPTURE_ZONE_COUNT = constants.gc.CAPTURE_ZONE_COUNT;
  config.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED = constants.gc.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED;
  config.CAPTURE_ZONE_PLANET_LEVEL_SCORE = constants.gc.CAPTURE_ZONE_PLANET_LEVEL_SCORE;
  config.CAPTURE_ZONE_RADIUS = constants.gc.CAPTURE_ZONE_RADIUS;
  config.CAPTURE_ZONES_ENABLED = constants.gc.CAPTURE_ZONES_ENABLED;
  config.CAPTURE_ZONES_PER_5000_WORLD_RADIUS = constants.gc.CAPTURE_ZONES_PER_5000_WORLD_RADIUS;
  config.CLAIM_VICTORY_ENERGY_PERCENT = constants.ac.CLAIM_VICTORY_ENERGY_PERCENT;
  config.CONFIG_HASH = constants.ac.CONFIG_HASH;
  config.CONFIRM_START = constants.ac.CONFIRM_START;
  config.DISABLE_ZK_CHECKS = constants.sc.DISABLE_ZK_CHECKS;
  config.INIT_PERLIN_MAX = constants.gc.INIT_PERLIN_MAX;
  config.INIT_PERLIN_MIN = constants.gc.INIT_PERLIN_MIN;
  config.INIT_PLANET_HASHES = constants.ac.INIT_PLANET_HASHES;
  config.LOCATION_REVEAL_COOLDOWN = constants.gc.LOCATION_REVEAL_COOLDOWN;
  config.MANUAL_SPAWN = constants.ac.MANUAL_SPAWN;
  config.MAX_NATURAL_PLANET_LEVEL = constants.gc.MAX_NATURAL_PLANET_LEVEL;
  config.MODIFIERS = [
    constants.ac.MODIFIERS.popCap,
    constants.ac.MODIFIERS.popGrowth,
    constants.ac.MODIFIERS.silverCap,
    constants.ac.MODIFIERS.silverGrowth,
    constants.ac.MODIFIERS.range,
    constants.ac.MODIFIERS.speed,
    constants.ac.MODIFIERS.defense,
    constants.ac.MODIFIERS.barbarianPercentage,
  ];
  config.NO_ADMIN = constants.ac.NO_ADMIN;
  config.NUM_TEAMS = constants.ac.NUM_TEAMS;
  config.PERLIN_LENGTH_SCALE = constants.sc.PERLIN_LENGTH_SCALE;
  config.PERLIN_MIRROR_X = constants.sc.PERLIN_MIRROR_X;
  config.PERLIN_MIRROR_Y = constants.sc.PERLIN_MIRROR_Y;
  config.PERLIN_THRESHOLD_1 = constants.gc.PERLIN_THRESHOLD_1;
  config.PERLIN_THRESHOLD_2 = constants.gc.PERLIN_THRESHOLD_2;
  config.PERLIN_THRESHOLD_3 = constants.gc.PERLIN_THRESHOLD_3;
  config.PHOTOID_ACTIVATION_DELAY = constants.gc.PHOTOID_ACTIVATION_DELAY;
  config.PLANET_LEVEL_JUNK = constants.gc.PLANET_LEVEL_JUNK;
  config.PLANET_LEVEL_THRESHOLDS = constants.gc.PLANET_LEVEL_THRESHOLDS;
  config.PLANET_RARITY = constants.gc.PLANET_RARITY;
  config.PLANET_TRANSFER_ENABLED = constants.gc.PLANET_TRANSFER_ENABLED;
  config.PLANET_TYPE_WEIGHTS = constants.gc.PLANET_TYPE_WEIGHTS;
  config.PLANETHASH_KEY = constants.sc.PLANETHASH_KEY;
  config.RANDOM_ARTIFACTS = constants.ac.RANDOM_ARTIFACTS;
  config.RANKED = constants.ac.RANKED;
  config.SILVER_SCORE_VALUE = constants.gc.SILVER_SCORE_VALUE;
  config.SPACE_JUNK_ENABLED = constants.gc.SPACE_JUNK_ENABLED;
  config.SPACE_JUNK_LIMIT = constants.gc.SPACE_JUNK_LIMIT;
  config.SPACESHIPS = [
    constants.ac.SPACESHIPS.mothership,
    constants.ac.SPACESHIPS.whale,
    constants.ac.SPACESHIPS.crescent,
    constants.ac.SPACESHIPS.gear,
    constants.ac.SPACESHIPS.titan,
  ];
  config.SPACETYPE_KEY = constants.sc.SPACETYPE_KEY;
  config.SPAWN_RIM_AREA = constants.gc.SPAWN_RIM_AREA;
  config.START_PAUSED = constants.ac.START_PAUSED;
  config.TARGET_PLANETS = constants.ac.TARGET_PLANETS;
  config.TARGETS_REQUIRED_FOR_VICTORY = constants.ac.TARGETS_REQUIRED_FOR_VICTORY;
  config.TEAMS_ENABLED = constants.ac.TEAMS_ENABLED;
  config.TIME_FACTOR_HUNDREDTHS = constants.gc.TIME_FACTOR_HUNDREDTHS;
  config.TOKEN_MINT_END_TIMESTAMP = constants.gc.TOKEN_MINT_END_TIMESTAMP; // Might be BigInt
  // Map Address => hexString => Bytes
  config.WHITELIST = constants.ai.allowedAddresses.map<Bytes>((x) =>
    Bytes.fromHexString(x.toHexString())
  );
  config.WHITELIST_ENABLED = constants.ai.allowListEnabled;
  config.WORLD_RADIUS_LOCKED = constants.gc.WORLD_RADIUS_LOCKED;
  config.WORLD_RADIUS_MIN = constants.gc.WORLD_RADIUS_MIN;
  return config;
}

export function buildPlanet(contract: DarkForest, id: string, locationDec: BigInt): ArenaPlanet {
  const planetData = contract.bulkGetPlanetsDataByIds([locationDec])[0];
  const arenaData = contract.planetsArenaInfo(locationDec);
  const locationId = hexStringToPaddedUnprefixed(locationDec);

  const planet = new ArenaPlanet(id);
  planet.locationDec = locationDec;
  planet.locationId = locationId;

  // Init planet might not always be revealed planet
  if (planetData.revealedCoords.x && planetData.revealedCoords.y) {
    planet.x = bjjFieldElementToSignedInt(planetData.revealedCoords.x);
    planet.y = bjjFieldElementToSignedInt(planetData.revealedCoords.y);
  }
  planet.perlin = planetData.info.perlin;
  planet.level = planetData.planet.planetLevel;
  planet.planetType = toPlanetType(planetData.planet.planetType);
  planet.targetPlanet = arenaData.targetPlanet;
  planet.spawnPlanet = arenaData.spawnPlanet;
  planet.capturer = null;
  // These are useful for confirming that spawn planets are fair.
  planet.isEnergyCapBoosted = isEnergyCapBoosted(locationId);
  planet.isEnergyGrowthBoosted = isEnergyGrowthBoosted(locationId);
  planet.isRangeBoosted = isRangeBoosted(locationId);
  planet.isSpeedBoosted = isSpeedBoosted(locationId);
  planet.isDefenseBoosted = isDefenseBoosted(locationId);
  planet.isSpaceJunkHalved = isSpaceJunkHalved(locationId);
  planet.spaceType = toSpaceType(planetData.info.spaceType);
  planet.captured = false;
  planet.blockedPlanetIds = arenaData.blockedPlanetIds.map<string>((x) =>
    arenaId(hexStringToPaddedUnprefixed(x))
  );
  planet.blockedPlanetHashes = arenaData.blockedPlanetIds.map<string>((x) =>
    hexStringToPaddedUnprefixed(x)
  );

  let arena = Arena.load(contract._address.toHexString());

  if (!arena) {
    log.error('attempting to attach planet to unkown arena: {}', [contract._address.toHexString()]);
    throw new Error();
  }

  planet.arena = arena.id;

  return planet;
}

export function loadArena(id: string): Arena {
  const entity = Arena.load(id);
  if (!entity) {
    log.error('attempting to load unkown arena: {}', [id]);
    throw new Error();
  }
  return entity;
}

export function loadPlayer(id: string): Player {
  const entity = Player.load(id);
  if (!entity) {
    log.error('attempting to load unkown Player: {}', [id]);
    throw new Error();
  }
  return entity;
}

export function loadArenaPlayer(id: string): ArenaPlayer {
  const entity = ArenaPlayer.load(id);
  if (!entity) {
    log.error('attempting to load unkown ArenaPlayer: {}', [id]);
    throw new Error();
  }
  return entity;
}

export function loadConfigPlayer(id: string): ConfigPlayer {
  const entity = ConfigPlayer.load(id);
  if (!entity) {
    log.error('attempting to load unkown ConfigPlayer: {}', [id]);
    throw new Error();
  }
  return entity;
}

export function loadBlocklist(id: string): Blocklist {
  const entity = Blocklist.load(id);
  if (!entity) {
    log.error('attempting to load unkown Blocklist: {}', [id]);
    throw new Error();
  }
  return entity;
}

export function loadArenaConfig(id: string): ArenaConfig {
  const entity = ArenaConfig.load(id);
  if (!entity) {
    log.error('attempting to load unkown ArenaConfig: {}', [id]);
    throw new Error();
  }
  return entity;
}

export function loadArenaPlanet(id: string): ArenaPlanet {
  const entity = ArenaPlanet.load(id);
  if (!entity) {
    log.error('attempting to load unkown ArenaPlanet: {}', [id]);
    throw new Error();
  }
  return entity;
}

export function loadArenaConstants(): DarkForest__getArenaConstantsResultValue0Struct {
  const contract = DarkForest.bind(dataSource.address());
  let result = contract.try_getArenaConstants();
  if (result.reverted) {
    log.error('Arena Constants reverted', []);
    throw new Error();
  } else {
    return result.value;
  }
}

export function loadGraphConstants(): DarkForest__getGraphConstantsResultValue0Struct {
  const contract = DarkForest.bind(dataSource.address());
  let result = contract.try_getGraphConstants();
  if (result.reverted) {
    log.error('Graph Constants reverted', []);
    throw new Error();
  } else {
    return result.value;
  }
}

export function loadWinners(): Array<Address> {
  const contract = DarkForest.bind(dataSource.address());
  let result = contract.try_getWinners();
  if (result.reverted) {
    log.error('Winners reverted', []);
    throw new Error();
  } else {
    return result.value;
  }
}

export function loadArenaPlayerInfo(key: Address): DarkForest__arenaPlayersResultValue0Struct {
  const contract = DarkForest.bind(dataSource.address());
  let result = contract.try_arenaPlayers(key);
  if (result.reverted) {
    log.error('Winners reverted', []);
    throw new Error();
  } else {
    return result.value;
  }
}

export function loadBadge(id: string): Badge {
  const entity = Badge.load(id);
  if (!entity) {
    log.error('attempting to load unkown Badge: {}', [id]);
    throw new Error();
  }
  return entity;
}
