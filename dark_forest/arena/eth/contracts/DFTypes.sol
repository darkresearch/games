// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

enum PlanetType {PLANET, SILVER_MINE, RUINS, TRADING_POST, SILVER_BANK}
enum PlanetEventType {ARRIVAL}
enum SpaceType {NEBULA, SPACE, DEEP_SPACE, DEAD_SPACE}
enum UpgradeBranch {DEFENSE, RANGE, SPEED}

struct Player {
    bool isInitialized;
    address player;
    uint256 initTimestamp;
    uint256 homePlanetId;
    uint256 lastRevealTimestamp;
    uint256 score;
    uint256 spaceJunk;
    uint256 spaceJunkLimit;
    bool claimedShips;
}

struct Planet {
    address owner;
    uint256 range;
    uint256 speed;
    uint256 defense;
    uint256 population;
    uint256 populationCap;
    uint256 populationGrowth;
    uint256 silverCap;
    uint256 silverGrowth;
    uint256 silver;
    uint256 planetLevel;
    PlanetType planetType;
    bool isHomePlanet;
}

struct RevealedCoords {
    uint256 locationId;
    uint256 x;
    uint256 y;
    address revealer;
}

struct PlanetExtendedInfo {
    bool isInitialized;
    uint256 createdAt;
    uint256 lastUpdated;
    uint256 perlin;
    SpaceType spaceType;
    uint256 upgradeState0;
    uint256 upgradeState1;
    uint256 upgradeState2;
    uint256 hatLevel;
    bool hasTriedFindingArtifact;
    uint256 prospectedBlockNumber;
    bool destroyed;
    uint256 spaceJunk;
}

struct PlanetExtendedInfo2 {
    bool isInitialized;
    uint256 pausers;
    address invader;
    uint256 invadeStartBlock;
    address capturer;
}

// For DFGetters
struct PlanetData {
    Planet planet;
    PlanetExtendedInfo info;
    PlanetExtendedInfo2 info2;
    RevealedCoords revealedCoords;
}

struct AdminCreatePlanetArgs {
    uint256 location;
    uint256 perlin;
    uint256 level;
    PlanetType planetType;
    bool requireValidLocationId;
}

struct PlanetEventMetadata {
    uint256 id;
    PlanetEventType eventType;
    uint256 timeTrigger;
    uint256 timeAdded;
}

enum ArrivalType {Unknown, Normal, Photoid, Wormhole}

struct DFPInitPlanetArgs {
    uint256 location;
    uint256 perlin;
    uint256 level;
    uint256 TIME_FACTOR_HUNDREDTHS;
    SpaceType spaceType;
    PlanetType planetType;
    bool isHomePlanet;
}

struct DFPMoveArgs {
    uint256 oldLoc;
    uint256 newLoc;
    uint256 maxDist;
    uint256 popMoved;
    uint256 silverMoved;
    uint256 movedArtifactId;
    uint256 abandoning;
    address sender;
}

struct DFPFindArtifactArgs {
    uint256 planetId;
    uint256 biomebase;
    address coreAddress;
}

struct DFPCreateArrivalArgs {
    address player;
    uint256 oldLoc;
    uint256 newLoc;
    uint256 actualDist;
    uint256 effectiveDistTimesHundred;
    uint256 popMoved;
    uint256 silverMoved;
    uint256 travelTime;
    uint256 movedArtifactId;
    ArrivalType arrivalType;
}

struct DFTCreateArtifactArgs {
    uint256 tokenId;
    address discoverer;
    uint256 planetId;
    ArtifactRarity rarity;
    Biome biome;
    ArtifactType artifactType;
    address owner;
    // Only used for spaceships
    address controller;
}

struct ArrivalData {
    uint256 id;
    address player;
    uint256 fromPlanet;
    uint256 toPlanet;
    uint256 popArriving;
    uint256 silverMoved;
    uint256 departureTime;
    uint256 arrivalTime;
    ArrivalType arrivalType;
    uint256 carriedArtifactId;
    uint256 distance;
}

struct PlanetDefaultStats {
    string label;
    uint256 populationCap;
    uint256 populationGrowth;
    uint256 range;
    uint256 speed;
    uint256 defense;
    uint256 silverGrowth;
    uint256 silverCap;
    uint256 barbarianPercentage;
}

struct Upgrade {
    uint256 popCapMultiplier;
    uint256 popGroMultiplier;
    uint256 rangeMultiplier;
    uint256 speedMultiplier;
    uint256 defMultiplier;
}

// for NFTs
enum ArtifactType {
    Unknown,
    Monolith,
    Colossus,
    Spaceship,
    Pyramid,
    Wormhole,
    PlanetaryShield,
    PhotoidCannon,
    BloomFilter,
    BlackDomain,
    ShipMothership,
    ShipCrescent,
    ShipWhale,
    ShipGear,
    ShipTitan
}

enum ArtifactRarity {Unknown, Common, Rare, Epic, Legendary, Mythic}

// for NFTs
struct Artifact {
    bool isInitialized;
    uint256 id;
    uint256 planetDiscoveredOn;
    ArtifactRarity rarity;
    Biome planetBiome;
    uint256 mintedAtTimestamp;
    address discoverer;
    ArtifactType artifactType;
    // an artifact is 'activated' iff lastActivated > lastDeactivated
    uint256 activations;
    uint256 lastActivated;
    uint256 lastDeactivated;
    uint256 wormholeTo; // location id
    address controller; // space ships can be controlled regardless of which planet they're on
}

// for artifact getters
struct ArtifactWithMetadata {
    Artifact artifact;
    Upgrade upgrade;
    Upgrade timeDelayedUpgrade; // for photoid canons specifically.
    address owner;
    uint256 locationId; // 0 if planet is not deposited into contract or is on a voyage
    uint256 voyageId; // 0 is planet is not deposited into contract or is on a planet
}

enum Biome {
    Unknown,
    Ocean,
    Forest,
    Grassland,
    Tundra,
    Swamp,
    Desert,
    Ice,
    Wasteland,
    Lava,
    Corrupted
}

struct ArenaPlanetInfo {
    bool spawnPlanet;
    bool targetPlanet;
    uint256[] blockedPlanetIds;
}

struct ArenaPlayerInfo {
    uint256 moves;
    bool ready;
    uint256 lastReadyTime;
    uint256 team;
}

struct ArenaCreateRevealPlanetArgs {
    uint256 location;
    uint256 x;
    uint256 y;
    uint256 perlin;
    uint256 level;
    PlanetType planetType;
    bool requireValidLocationId;
    bool isTargetPlanet;
    bool isSpawnPlanet;
    uint256[] blockedPlanetIds;
}

struct Modifiers {
    uint256 popCap;
    uint256 popGrowth;
    uint256 silverCap;
    uint256 silverGrowth;
    uint256 range;
    uint256 speed;
    uint256 defense;
    uint256 barbarianPercentage;
}

enum Mod {
    popCap,
    popGrowth,
    silverCap,
    silverGrowth,
    range,
    speed,
    defense,
    barbarianPercentage
}
// # Mothership, Whale, Crescent, Gear, Titan
struct Spaceships{
    bool mothership;
    bool whale;
    bool crescent;
    bool gear;
    bool titan;
}

struct RevealProofArgs {
    uint256[2]  _a;
    uint256[2][2] _b;
    uint256[2] _c;
    uint256[9] _input;
}

// Values that are critical for determining if a match is valid. 
struct InitArgs {
    bool START_PAUSED;
    bool ADMIN_CAN_ADD_PLANETS;
    uint256 LOCATION_REVEAL_COOLDOWN;
    uint256 TOKEN_MINT_END_TIMESTAMP;
    bool WORLD_RADIUS_LOCKED;
    uint256 WORLD_RADIUS_MIN;
    // SNARK keys and perlin params
    bool DISABLE_ZK_CHECKS;
    uint256 PLANETHASH_KEY;
    uint256 SPACETYPE_KEY;
    uint256 BIOMEBASE_KEY;
    bool PERLIN_MIRROR_X;
    bool PERLIN_MIRROR_Y;
    uint256 PERLIN_LENGTH_SCALE; // must be a power of two up to 8192
    // Game config
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
    uint8[5][10][4] PLANET_TYPE_WEIGHTS; // spaceType (enum 0-3) -> planetLevel (0-7) -> planetType (enum 0-4)
    uint256 SILVER_SCORE_VALUE;
    uint256[6] ARTIFACT_POINT_VALUES;
    uint256 PHOTOID_ACTIVATION_DELAY;
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
    bool CAPTURE_ZONES_ENABLED;
    uint256 CAPTURE_ZONE_COUNT;
    uint256 CAPTURE_ZONE_CHANGE_BLOCK_INTERVAL;
    uint256 CAPTURE_ZONE_RADIUS;
    uint256[10] CAPTURE_ZONE_PLANET_LEVEL_SCORE;
    uint256 CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED;
    uint256 CAPTURE_ZONES_PER_5000_WORLD_RADIUS;
    // Target Planet
    bool TARGET_PLANETS;
    uint256 CLAIM_VICTORY_ENERGY_PERCENT;
    // Manual Spawn
    bool MANUAL_SPAWN;

    uint256[8] MODIFIERS;
    bool[5] SPACESHIPS;

    bool RANDOM_ARTIFACTS;
    bool NO_ADMIN;
    ArenaCreateRevealPlanetArgs[] INIT_PLANETS;
    bool CONFIRM_START;
    uint256 TARGETS_REQUIRED_FOR_VICTORY;
    bool BLOCK_MOVES;
    bool BLOCK_CAPTURE;    
    bool TEAMS_ENABLED;
    uint256 NUM_TEAMS;
    bool RANKED;
}

// Values that are useful but not constant across arenas (whitelisted players, which planet goes to which team)
struct AuxiliaryArgs {
    bool allowListEnabled;
    string artifactBaseURI;
    address[] allowedAddresses;
}

