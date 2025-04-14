import type { DarkForest } from '@darkforest_eth/contracts/typechain';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { BigNumber, utils } from 'ethers';
import hre from 'hardhat';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployAndCutArena } from '../../tasks/arena-deploy';
import { deployAndCut } from '../../tasks/deploy';
import {
  arenaWorldInitializers,
  blockListInitializers,
  confirmStartInitializers,
  deterministicArtifactInitializers,
  initializers,
  initPlanetsInitializers,
  manualSpawnInitializers,
  multipleTargetPlanetVictoryInitializers,
  noAdminInitializers,
  noPlanetTransferInitializers,
  planetLevelThresholdInitializer,
  target4Initializers,
  targetPlanetInitializers,
  teamsInitializers,
} from './WorldConstants';

export interface World {
  contract: DarkForest;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  deployer: SignerWithAddress;
  user1Core: DarkForest;
  user2Core: DarkForest;
}

export interface Player {
  isInitialized: boolean;
  player: string;
  initTimestamp: BigNumber;
  homePlanetId: BigNumber;
  lastRevealTimestamp: BigNumber;
  score: BigNumber;
}

export interface InitializeWorldArgs {
  initializers: HardhatRuntimeEnvironment['initializers'];
  allowListEnabled: boolean;
  allowedAddresses?: string[];
  arena?: boolean;
}

export function defaultWorldFixture(): Promise<World> {
  return initializeWorld({
    initializers,
    allowListEnabled: false,
  });
}


export function growingWorldFixture(): Promise<World> {
  return initializeWorld({
    initializers: target4Initializers,
    allowListEnabled: false,
  });
}

export function whilelistWorldFixture(): Promise<World> {
  return initializeWorld({
    initializers,
    allowListEnabled: true,
  });
}

export function noPlanetTransferFixture(): Promise<World> {
  return initializeWorld({
    initializers: noPlanetTransferInitializers,
    allowListEnabled: false,
  });
}

export function planetLevelThresholdFixture(): Promise<World> {
  return initializeWorld({
    initializers: planetLevelThresholdInitializer,
    allowListEnabled: false,
    arena: true,
  });
}

export function testGasLimitInitFixture(): Promise<World> {
  return initializeWorld({
    initializers: initPlanetsInitializers,
    allowListEnabled: false,
    allowedAddresses: [
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65", "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
      "0x976ea74026e726554db657fa54763abd0c3a0aa9", "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
      "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f", "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
      "0xbcd4042de499d14e55001ccbb24a551f3b954096", "0x71be63f3384f5fb98995898a86b02fb2426c5788",
      "0xfabb0ac9d68b0b445fb7357272ff202c5651694a", "0x1cbd3b2770909d4e10f157cabc84c7264073c9ec",
      "0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097", "0xcd3b766ccdd6ae721141f452c550ca635964ce71",
      "0x2546bcd3c84621e976d8185a91a922ae77ecec30", "0xbda5747bfd65f08deb54cb465eb87d40e51b197e",
      "0xdd2fd4581271e230360230f9337d5c0430bf44c0", "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199",
    ],
    arena: true,
  });
}

/*
Identical to defaultWorldFixture but with arena facets cut in
*/
export function arenaWorldFixture(): Promise<World> {
  return initializeWorld({
    initializers: arenaWorldInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export function noAdminWorldFixture(): Promise<World> {
  return initializeWorld({
    initializers: noAdminInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export function initPlanetsArenaFixture(): Promise<World> {
  return initializeWorld({
    initializers: initPlanetsInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export function manualSpawnFixture(): Promise<World> {
  return initializeWorld({
    initializers: manualSpawnInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export function targetPlanetFixture(): Promise<World> {
  return initializeWorld({
    initializers: targetPlanetInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export function modifiedWorldFixture(mod: number): Promise<World> {
  return initializeWorld({
    initializers: { ...initializers, MODIFIERS: [mod, mod, mod, mod, mod, mod, mod, mod] },
    allowListEnabled: false,
    arena: true,
  });
}

export function spaceshipWorldFixture(
  spaceships: [boolean, boolean, boolean, boolean, boolean]
): Promise<World> {
  return initializeWorld({
    initializers: { ...initializers, SPACESHIPS: spaceships },
    allowListEnabled: false,
    arena: true,
  });
}

export function deterministicArtifactFixture(): Promise<World> {
  return initializeWorld({
    initializers: deterministicArtifactInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export function confirmStartFixture(): Promise<World> {
  return initializeWorld({
    initializers: confirmStartInitializers,
    allowListEnabled: true,
    arena: true,
  });
}

export async function allowListOnInitFixture(): Promise<World> {
  return initializeWorld({
    initializers: arenaWorldInitializers,
    allowListEnabled: true,
    arena: true,
  });
}

export async function multipleTargetPlanetVictoryFixture(): Promise<World> {
  return initializeWorld({
    initializers: multipleTargetPlanetVictoryInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export async function blockListFixture(): Promise<World> {
  return initializeWorld({
    initializers: blockListInitializers,
    allowListEnabled: false,
    arena: true,
  });
}

export function teamsFixture(): Promise<World> {
  return initializeWorld({
    initializers: teamsInitializers,
    allowListEnabled: false,
    arena: true
  });
}

export async function initializeWorld({
  initializers,
  allowListEnabled,
  allowedAddresses = [],
  arena = false,
}: InitializeWorldArgs): Promise<World> {
  const [deployer, user1, user2] = await hre.ethers.getSigners();

  // The tests assume that things get mined right away
  // TODO(#912): This means the tests are wildly fragile and probably need to be rewritten
  await hre.network.provider.send('evm_setAutomine', [true]);
  await hre.network.provider.send('evm_setIntervalMining', [0]);

  let contract: DarkForest;

  // let deploy = arena ? deployAndCutArena : deployAndCut;
  let deploy = deployAndCutArena;

  if (allowListEnabled) allowedAddresses = [deployer.address, user1.address, user2.address];

  const [diamond, diamondInit] = await deploy(
    {
      ownerAddress: deployer.address,
      allowListEnabled,
      allowedAddresses,
      initializers,
      save: false,
    },
    hre
  );
  contract = diamond;

  await deployer.sendTransaction({
    to: contract.address,
    value: utils.parseEther('0.5'), // good for about (100eth / 0.5eth/test) = 200 tests
  });

  return {
    // If any "admin only" contract state needs to be changed, use `contracts`
    // to call methods with deployer privileges. e.g. `world.contracts.core.pause()`
    contract,
    user1,
    user2,
    deployer,
    user1Core: contract.connect(user1),
    user2Core: contract.connect(user2),
  };
}
