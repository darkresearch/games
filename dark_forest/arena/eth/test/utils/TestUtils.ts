import { LOCATION_ID_UB } from '@darkforest_eth/constants';
import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import { modPBigInt } from '@darkforest_eth/hashing';
import { address, locationIdFromDecStr, RawRevealedCoords } from '@darkforest_eth/serde';
import { Initializers } from '@darkforest_eth/settings';
import {
  buildContractCallArgs,
  SnarkJSProofAndSignals,
  WhitelistSnarkContractCallArgs,
  WhitelistSnarkInput,
  whitelistSnarkWasmPath,
  whitelistSnarkZkeyPath,
} from '@darkforest_eth/snarks';
import {
  ArtifactRarity,
  ArtifactType,
  Biome,
  LocationId,
  PlanetLevel,
  RevealedCoords,
  SpaceType,
} from '@darkforest_eth/types';
import { bigIntFromKey } from '@darkforest_eth/whitelist';
import bigInt from 'big-integer';
import { BigNumber, BigNumberish } from 'ethers';
import { ethers, waffle } from 'hardhat';
// @ts-ignore
import * as snarkjs from 'snarkjs';
import { TestLocation } from './TestLocation';
import { World } from './TestWorld';
import { ARTIFACT_PLANET_1, initializers, LARGE_INTERVAL, NUM_BLOCKS } from './WorldConstants';

const { constants } = ethers;

const {
  PLANETHASH_KEY,
  SPACETYPE_KEY,
  BIOMEBASE_KEY,
  PERLIN_LENGTH_SCALE,
  PERLIN_MIRROR_X,
  PERLIN_MIRROR_Y,
} = initializers;

export const ZERO_ADDRESS = constants.AddressZero;
export const BN_ZERO = constants.Zero;

export const fixtureLoader = waffle.createFixtureLoader();

export function hexToBigNumber(hex: string): BigNumber {
  return BigNumber.from(`0x${hex}`);
}

export function decodeRevealedCoords(coords: { x: number; y: number }) {
  let xBI = bigInt(coords.x.toString()); // nonnegative residue mod p
  let yBI = bigInt(coords.y.toString()); // nonnegative residue mod p
  let x = 0;
  let y = 0;
  if (xBI.gt(LOCATION_ID_UB.divide(2))) {
    xBI = xBI.minus(LOCATION_ID_UB);
  }
  x = xBI.toJSNumber();
  if (yBI.gt(LOCATION_ID_UB.divide(2))) {
    yBI = yBI.minus(LOCATION_ID_UB);
  }
  y = yBI.toJSNumber();
  return {
    x,
    y,
  };
}

export function getInitPlanetHash(initPlanet: {
  x: string;
  y: string;
  level: number;
  planetType: number;
  requireValidLocationId: boolean;
  location: string;
  perlin: number;
  isTargetPlanet: boolean;
  isSpawnPlanet: boolean;
  blockedPlanetIds: string[];
}): string {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return ethers.utils.keccak256(
    abiCoder.encode(
      ['uint', 'uint', 'uint', 'uint', 'uint', 'bool', 'bool', 'bool', 'uint[]'],
      [
        BigInt(initPlanet.location),
        BigInt(initPlanet.x),
        BigInt(initPlanet.y),
        initPlanet.perlin,
        initPlanet.planetType,
        initPlanet.requireValidLocationId,
        initPlanet.isTargetPlanet,
        initPlanet.isSpawnPlanet,
        initPlanet.blockedPlanetIds.map(x => BigInt(x))
      ]
    )
  );
}

export function getDeterministicArtifact(planet: TestLocation, initializers: Initializers) {

  const abiCoder = ethers.utils.defaultAbiCoder;

  const artifactSeed = ethers.utils.keccak256(
    abiCoder.encode(['uint'], [BigInt(planet.id.toHexString())])
  );

  const seedHash = ethers.utils.keccak256(abiCoder.encode(['uint'], [BigInt(artifactSeed)]));

  const seed = BigNumber.from(artifactSeed);
  const lastByteOfSeed = seed.mod(BigNumber.from('0xff')).toNumber();
  const bigLastByte = BigNumber.from(lastByteOfSeed);

  const secondLastByteOfSeed = ((seed.sub(bigLastByte)).div(BigNumber.from(256))).mod(BigNumber.from('0xff')).toNumber();

  const perlin = BigNumber.from(planet.perlin).toNumber();
  const biome = getBiome({ perlin, biomebase: initializers.BIOMEBASE_KEY, initializers });

  console.log(`seed hash ${seed.toHexString()}`);
  console.log(`seed string ${seed.toString()}`);
  console.log('mod', BigNumber.from('0xff').toNumber())
  console.log('lastByte', lastByteOfSeed);
  console.log('secondLastByte', secondLastByteOfSeed);
  console.log(`hex representations: last byte: ${bigLastByte.toHexString()} second last: ${BigNumber.from(secondLastByteOfSeed).toHexString()}`);
  console.log('biome', biome);

  console.log('js artifact seed hex', artifactSeed);
  console.log('hash of artifact seed', seedHash);

  let artifactType: ArtifactType = ArtifactType.Pyramid;

  if (lastByteOfSeed < 39) {
    artifactType = ArtifactType.Monolith;
  } else if (lastByteOfSeed < 78) {
    artifactType = ArtifactType.Colossus;
  }
  // else if (lastByteOfSeed < 117) {
  //     artifactType = ArtifactType.Spaceship;
  // }
  else if (lastByteOfSeed < 156) {
    artifactType = ArtifactType.Pyramid;
  } else if (lastByteOfSeed < 171) {
    artifactType = ArtifactType.Wormhole;
  } else if (lastByteOfSeed < 186) {
    artifactType = ArtifactType.PlanetaryShield;
  } else if (lastByteOfSeed < 201) {
    artifactType = ArtifactType.PhotoidCannon;
  } else if (lastByteOfSeed < 216) {
    artifactType = ArtifactType.BloomFilter;
  } else if (lastByteOfSeed < 231) {
    artifactType = ArtifactType.BlackDomain;
  } else {
    if (biome === Biome.ICE) {
      artifactType = ArtifactType.PlanetaryShield;
    } else if (biome === Biome.LAVA) {
      artifactType = ArtifactType.PhotoidCannon;
    } else if (biome === Biome.WASTELAND) {
      artifactType = ArtifactType.BloomFilter;
    } else if (biome === Biome.CORRUPTED) {
      artifactType = ArtifactType.BlackDomain;
    } else {
      artifactType = ArtifactType.Wormhole;
    }
    artifactType = ArtifactType.PhotoidCannon;
  }

  let bonus = 0;
  if (secondLastByteOfSeed < 4) {
    bonus = 2;
  } else if (secondLastByteOfSeed < 16) {
    bonus = 1;
  }

  const rarity = artifactRarityFromPlanetLevel(planetLevelFromHexPerlin(planet.id.toHexString(), perlin, initializers) + bonus);

  console.log('artifactType', artifactType, 'rarity', rarity);

  return { type: artifactType, rarity };
}

export function makeRevealArgs(
  planetLoc: TestLocation,
  x: number,
  y: number
): [
  [BigNumberish, BigNumberish],
  [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]],
  [BigNumberish, BigNumberish],
  [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ]
] {
  return [
    [BN_ZERO, BN_ZERO],
    [
      [BN_ZERO, BN_ZERO],
      [BN_ZERO, BN_ZERO],
    ],
    [BN_ZERO, BN_ZERO],
    [
      planetLoc.id,
      planetLoc.perlin,
      modPBigInt(x).toString(),
      modPBigInt(y).toString(),
      PLANETHASH_KEY,
      SPACETYPE_KEY,
      PERLIN_LENGTH_SCALE,
      PERLIN_MIRROR_X ? '1' : '0',
      PERLIN_MIRROR_Y ? '1' : '0',
    ],
  ];
}

export async function makeWhitelistArgs(key: string, recipient: string) {
  const input: WhitelistSnarkInput = {
    key: bigIntFromKey(key).toString(),
    recipient: bigInt(recipient.substring(2), 16).toString(),
  };

  const fullProveResponse = await snarkjs.groth16.fullProve(
    input,
    whitelistSnarkWasmPath,
    whitelistSnarkZkeyPath
  );
  const { proof, publicSignals }: SnarkJSProofAndSignals = fullProveResponse;
  return buildContractCallArgs(proof, publicSignals) as WhitelistSnarkContractCallArgs;
}

export function makeInitArgs(
  planetLoc: TestLocation,
  spawnRadius: number = initializers.WORLD_RADIUS_MIN,
  team: number = 0
): [
  [BigNumberish, BigNumberish],
  [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]],
  [BigNumberish, BigNumberish],
  [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ],
  BigNumberish

] {
  return [
    [BN_ZERO, BN_ZERO],
    [
      [BN_ZERO, BN_ZERO],
      [BN_ZERO, BN_ZERO],
    ],
    [BN_ZERO, BN_ZERO],
    [
      planetLoc.id,
      planetLoc.perlin,
      spawnRadius,
      PLANETHASH_KEY,
      SPACETYPE_KEY,
      PERLIN_LENGTH_SCALE,
      PERLIN_MIRROR_X ? '1' : '0',
      PERLIN_MIRROR_Y ? '1' : '0',
    ],
    team
  ];
}

export function makeMoveArgs(
  oldLoc: TestLocation,
  newLoc: TestLocation,
  maxDist: BigNumberish,
  popMoved: BigNumberish,
  silverMoved: BigNumberish,
  movedArtifactId: BigNumberish = 0,
  abandoning: BigNumberish = 0
): [
  [BigNumberish, BigNumberish],
  [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]],
  [BigNumberish, BigNumberish],
  [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ]
] {
  return [
    [0, 0],
    [
      [0, 0],
      [0, 0],
    ],
    [0, 0],
    [
      oldLoc.id,
      newLoc.id,
      newLoc.perlin,
      newLoc.distFromOrigin + 1,
      maxDist,
      PLANETHASH_KEY,
      SPACETYPE_KEY,
      PERLIN_LENGTH_SCALE,
      PERLIN_MIRROR_X ? '1' : '0',
      PERLIN_MIRROR_Y ? '1' : '0',
      popMoved,
      silverMoved,
      movedArtifactId,
      abandoning,
    ],
  ];
}

export function makeFindArtifactArgs(
  location: TestLocation
): [
  [BigNumberish, BigNumberish],
  [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]],
  [BigNumberish, BigNumberish],
  [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
] {
  return [
    [1, 2],
    [
      [1, 2],
      [3, 4],
    ],
    [5, 6],
    [
      location.id,
      1,
      PLANETHASH_KEY,
      BIOMEBASE_KEY,
      PERLIN_LENGTH_SCALE,
      PERLIN_MIRROR_X ? '1' : '0',
      PERLIN_MIRROR_Y ? '1' : '0',
    ],
  ];
}

/**
 * interval is measured in seconds
 */
export async function increaseBlockchainTime(interval = LARGE_INTERVAL) {
  await ethers.provider.send('evm_increaseTime', [interval]);
  await ethers.provider.send('evm_mine', []);
}

export async function increaseBlocks(blocks = NUM_BLOCKS) {
  // await ethers.provider.send('evm_increaseTime', [LARGE_INTERVAL]);
  for (let i = 0; i < blocks; i++) {
    await ethers.provider.send('evm_mine', []);
  }
}

export async function getCurrentTime() {
  return (await ethers.provider.getBlock('latest')).timestamp;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getStatSum(planet: any) {
  let statSum = 0;
  for (const stat of ['speed', 'range', 'defense', 'populationCap', 'populationGrowth']) {
    statSum += planet[stat].toNumber();
  }
  return statSum;
}

// conquers an untouched planet `to` by repeatedly sending attacks from `from`
// assumes that `to` is owned by `signer` and that `from` is an unowned planet
// throws if `to` is owned
export async function conquerUnownedPlanet(
  world: World,
  signer: DarkForest,
  from: TestLocation,
  to: TestLocation
) {
  const fromData = await world.contract.planets(from.id);
  let toData = await world.contract.planets(to.id);
  if (toData.owner !== ZERO_ADDRESS) {
    throw new Error('called conquerUnownedPlanet to conquer owned planet');
  }
  const attackEnergyCost = fromData.populationCap.toNumber() * 0.9;
  await increaseBlockchainTime();
  await (await signer.move(...makeMoveArgs(from, to, 0, attackEnergyCost, 0))).wait(); // creates planet in contract
  toData = await world.contract.planets(to.id);
  const toPlanetStartingPop = toData.population.toNumber(); // move hasn't yet been applied

  await (await signer.refreshPlanet(to.id)).wait(); // applies move, since 0 moveDist
  toData = await world.contract.planets(to.id);

  if (toData.owner === ZERO_ADDRESS) {
    // send additional attacks if not yet conquered
    const attackDamage = toPlanetStartingPop - toData.population.toNumber();
    const attacksNeeded = Math.floor(toData.population.toNumber() / attackDamage) + 1;
    for (let i = 0; i < attacksNeeded; i++) {
      await increaseBlockchainTime();
      await signer.move(...makeMoveArgs(from, to, 0, attackEnergyCost, 0));
    }
  }
}

// shuttles silver from `silverProducer` to `to` until `to` is maxed on silver
export async function feedSilverToCap(
  world: World,
  signer: DarkForest,
  silverMine: TestLocation,
  to: TestLocation
) {
  const silverMineData = await world.contract.planets(silverMine.id);
  const toData = await world.contract.planets(to.id);
  const attackEnergyCost = silverMineData.populationCap.toNumber() * 0.1;
  const silverMineSilverCap = silverMineData.silverCap.toNumber();
  const toSilverCap = toData.silverCap.toNumber();

  for (let i = 0; i < Math.ceil(toSilverCap / silverMineSilverCap); i++) {
    await increaseBlockchainTime();
    await signer.move(...makeMoveArgs(silverMine, to, 0, attackEnergyCost, silverMineSilverCap));
  }
}

// returns the ID of the artifact minted
export async function user1MintArtifactPlanet(user1Core: DarkForest) {
  await user1Core.prospectPlanet(ARTIFACT_PLANET_1.id);
  await increaseBlockchainTime();
  const findArtifactTx = await user1Core.findArtifact(...makeFindArtifactArgs(ARTIFACT_PLANET_1));
  const findArtifactReceipt = await findArtifactTx.wait();
  // 0th event is erc721 transfer (i think); 1st event is UpdateArtifact, 2nd argument of this event is artifactId
  const artifactId = findArtifactReceipt.events?.[1].args?.[1];
  return artifactId;
}

export async function getArtifactsOwnedBy(contract: DarkForest, addr: string) {
  const artifactsIds = await contract.getPlayerArtifactIds(addr);
  return (await contract.bulkGetArtifactsByIds(artifactsIds)).map(
    (artifactWithMetadata) => artifactWithMetadata[0]
  );
}

export async function createArtifactOnPlanet(
  contract: DarkForest,
  owner: string,
  planet: TestLocation,
  type: ArtifactType,
  { rarity, biome }: { rarity?: ArtifactRarity; biome?: Biome } = {}
) {
  rarity ||= ArtifactRarity.Common;
  biome ||= Biome.FOREST;

  const tokenId = hexToBigNumber(Math.floor(Math.random() * 10000000000).toString(16));

  await contract.adminGiveArtifact({
    tokenId,
    discoverer: owner,
    owner: owner,
    planetId: planet.id,
    rarity: rarity.toString(),
    biome: biome.toString(),
    artifactType: type.toString(),
    controller: ZERO_ADDRESS,
  });

  return tokenId;
}

function artifactRarityFromPlanetLevel(planetLevel: number): ArtifactRarity {
  if (planetLevel <= 1) return ArtifactRarity.Common;
  else if (planetLevel <= 3) return ArtifactRarity.Rare;
  else if (planetLevel <= 5) return ArtifactRarity.Epic;
  else if (planetLevel <= 7) return ArtifactRarity.Legendary;
  else return ArtifactRarity.Mythic;
}

function getBiome({
  perlin,
  biomebase,
  initializers,
}: {
  perlin: number;
  biomebase: number;
  initializers: Initializers;
}): Biome {
  const spaceType = spaceTypeFromPerlin(perlin, initializers);

  if (spaceType === SpaceType.DEAD_SPACE) return Biome.CORRUPTED;

  let biome = 3 * spaceType;
  if (biomebase < initializers.BIOME_THRESHOLD_1) biome += 1;
  else if (biomebase < initializers.BIOME_THRESHOLD_2) biome += 2;
  else biome += 3;

  return biome as Biome;
}

function spaceTypeFromPerlin(perlin: number, initializers: Initializers): SpaceType {
  if (perlin < initializers.PERLIN_THRESHOLD_1) {
    return SpaceType.NEBULA;
  } else if (perlin < initializers.PERLIN_THRESHOLD_2) {
    return SpaceType.SPACE;
  } else if (perlin < initializers.PERLIN_THRESHOLD_3) {
    return SpaceType.DEEP_SPACE;
  } else {
    return SpaceType.DEAD_SPACE;
  }
}

function getBytesFromHex(hexStr: string, startByte: number, endByte: number) {
  const byteString = hexStr.substring(2 * startByte, 2 * endByte);
  return bigInt(`0x${byteString}`);
}

function planetLevelFromHexPerlin(hex: string, perlin: number, initializers: Initializers): number {
  const spaceType = spaceTypeFromPerlin(perlin, initializers);

  const levelBigInt = getBytesFromHex(hex, 4, 7);

  const MIN_PLANET_LEVEL = 0;

  let ret = MIN_PLANET_LEVEL;

  for (let type = initializers.MAX_NATURAL_PLANET_LEVEL; type >= MIN_PLANET_LEVEL; type--) {
    if (levelBigInt < bigInt(initializers.PLANET_LEVEL_THRESHOLDS[type])) {
      ret = type;
      break;
    }
  }

  if (spaceType === SpaceType.NEBULA && ret > PlanetLevel.FOUR) {
    ret = PlanetLevel.FOUR;
  }
  if (spaceType === SpaceType.SPACE && ret > PlanetLevel.FIVE) {
    ret = PlanetLevel.FIVE;
  }
  if (ret > initializers.MAX_NATURAL_PLANET_LEVEL) {
    
    ret = initializers.MAX_NATURAL_PLANET_LEVEL as PlanetLevel;
  }

  return ret as number;
}