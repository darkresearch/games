import { task, types } from 'hardhat/config';
import type { HardhatRuntimeEnvironment, Libraries } from 'hardhat/types';
import ts from 'typescript';
import * as settings from '../settings';
import {
  deployContract,
  deployDiamond,
  saveDeploy,
  writeToContractsPackage,
} from '../utils/deploy';
import { DiamondChanges } from '../utils/diamond';
import {
  deployAdminFacet,
  deployArtifactFacet,
  deployCaptureFacet,
  deployCoreFacet,
  deployDebugFacet,
  deployDiamondCutFacet,
  deployDiamondLoupeFacet,
  deployGetterFacet,
  deployLibraries,
  deployLobbyFacet,
  deployMoveFacet,
  deployOwnershipFacet,
  deployWhitelistFacet,
} from '../tasks/deploy';

task('arena:deploy', 'deploy all Arena Diamond.')
  .addOptionalParam('whitelist', 'override the whitelist', false, types.boolean)
  .addOptionalParam('faucet', 'deploy the faucet', false, types.boolean)
  .addOptionalParam('fund', 'amount of eth to fund faucet contract for fund', 0, types.float)
  .addOptionalParam(
    'subgraph',
    'bring up subgraph with name (requires docker)',
    undefined,
    types.string
  )
  .setAction(deploy);

async function deploy(
  args: { whitelist?: boolean; fund: number; subgraph?: string; faucet?: boolean },
  hre: HardhatRuntimeEnvironment
) {
  const isDev = hre.network.name === 'localhost' || hre.network.name === 'hardhat';

  let allowListEnabled = false;

  // Ensure we have required keys in our initializers
  settings.required(hre.initializers, ['PLANETHASH_KEY', 'SPACETYPE_KEY', 'BIOMEBASE_KEY']);

  // need to force a compile for tasks
  await hre.run('compile');

  // Were only using one account, getSigners()[0], the deployer.
  // Is deployer of all contracts, but ownership is transferred to ADMIN_PUBLIC_ADDRESS if set
  const [deployer] = await hre.ethers.getSigners();

  const requires = hre.ethers.utils.parseEther('2');
  const balance = await deployer.getBalance();

  // Only when deploying to production, give the deployer wallet money,
  // in order for it to be able to deploy the contracts
  if (!isDev && balance.lt(requires)) {
    throw new Error(
      `${deployer.address} requires ~$${hre.ethers.utils.formatEther(
        requires
      )} but has ${hre.ethers.utils.formatEther(balance)} top up and rerun`
    );
  }
  const [diamond, diamondInit, initReceipt] = await deployAndCutArena(
    { ownerAddress: deployer.address, allowListEnabled, initializers: hre.initializers },
    hre
  );

  if (allowListEnabled && args.fund > 0) {
    // Note Ive seen `ProviderError: Internal error` when not enough money...
    console.log(`funding whitelist with ${args.fund}`);

    const tx = await deployer.sendTransaction({
      to: diamond.address,
      value: hre.ethers.utils.parseEther(args.fund.toString()),
    });
    await tx.wait();

    console.log(
      `Sent ${args.fund} to diamond contract (${diamond.address}) to fund drips in whitelist facet`
    );

    const whitelistBalance = await hre.ethers.provider.getBalance(diamond.address);
    console.log(`Whitelist balance ${whitelistBalance}`);
  }

  // give all contract administration over to an admin adress if was provided
  if (hre.ADMIN_PUBLIC_ADDRESS) {
    const ownership = await hre.ethers.getContractAt('DarkForest', diamond.address);
    const tx = await ownership.transferOwnership(hre.ADMIN_PUBLIC_ADDRESS);
    await tx.wait();
    console.log(`transfered diamond ownership to ${hre.ADMIN_PUBLIC_ADDRESS}`);
  }

  if (args.subgraph) {
    await hre.run('subgraph:deploy', { name: args.subgraph });
    console.log('deployed subgraph');
  }

  if (args.faucet) {
    await hre.run('faucet:deploy', { value: args.fund });
    console.log('deployed faucet');
  }

  // TODO: Upstream change to update task name from `hardhat-4byte-uploader`
  if (!isDev) {
    try {
      await hre.run('upload-selectors', { noCompile: true });
    } catch {
      console.warn('WARNING: Unable to update 4byte database with our selectors');
      console.warn('Please run the `upload-selectors` task manually so selectors can be reversed');
    }
  }

  console.log('Deployed successfully. Godspeed cadet.');
}

task('arena:deploy:initializer', 'deploy arena initializer for upgrades').setAction(
  deployInitializer
);

async function deployInitializer({}, hre: HardhatRuntimeEnvironment) {
  await hre.run('utils:assertChainId');

  const libraries = await deployLibraries({}, hre);
  const LibGameUtils = libraries.LibGameUtils;

  const diamondInit = await deployContract('DFArenaInitialize', { LibGameUtils }, hre);
  console.log(
    `deployed initializer to ${diamondInit.address}. COPY ME TO @darkforest_eth/contracts. !!`
  );
}

export async function deployAndCutArena(
  {
    ownerAddress,
    allowListEnabled,
    allowedAddresses=[],
    initializers,
    save = true,
  }: {
    ownerAddress: string;
    allowListEnabled: boolean;
    allowedAddresses?: string[];
    initializers: HardhatRuntimeEnvironment['initializers'];
    save?: boolean;
  },
  hre: HardhatRuntimeEnvironment
) {
  const isDev = hre.network.name === 'localhost' || hre.network.name === 'hardhat';

  const changes = new DiamondChanges();

  const libraries = await deployLibraries({}, hre);

  // Diamond Spec facets
  // Note: These won't be updated during an upgrade without manual intervention
  const diamondCutFacet = await deployDiamondCutFacet({}, libraries, hre);
  const diamondLoupeFacet = await deployDiamondLoupeFacet({}, libraries, hre);
  const ownershipFacet = await deployOwnershipFacet({}, libraries, hre);

  // The `cuts` to perform for Diamond Spec facets
  const diamondSpecFacetCuts = [
    // Note: The `diamondCut` is omitted because it is cut upon deployment
    ...changes.getFacetCuts('DiamondLoupeFacet', diamondLoupeFacet),
    ...changes.getFacetCuts('OwnershipFacet', ownershipFacet),
  ];

  const diamond = await deployDiamond(
    {
      ownerAddress,
      // The `diamondCutFacet` is cut upon deployment
      diamondCutAddress: diamondCutFacet.address,
    },
    libraries,
    hre
  );

  // Dark Forest facets
  const coreFacet = await deployCoreFacet({}, libraries, hre);
  const moveFacet = await deployMoveFacet({}, libraries, hre);
  const captureFacet = await deployCaptureFacet({}, libraries, hre);
  const artifactFacet = await deployArtifactFacet(
    { diamondAddress: diamond.address },
    libraries,
    hre
  );
  const getterFacet = await deployGetterFacet({}, libraries, hre);
  const whitelistFacet = await deployWhitelistFacet({}, libraries, hre);
  const adminFacet = await deployAdminFacet({}, libraries, hre);

  const arenaCoreFacet = await deployArenaCoreFacet({}, libraries, hre);
  const arenaGetterFacet = await deployArenaGetterFacet({}, libraries, hre);
  const spaceshipConfigFacet = await deployArenaSpaceShipFacet({}, libraries, hre);
  const tournamentFacet = await deployArenaTournamentFacet({}, libraries, hre);
  const startFacet = await deployArenaStarterFacet({}, libraries, hre);

  // The `cuts` to perform for Dark Forest facets
  const darkForestFacetCuts = [
    ...changes.getFacetCuts('DFCoreFacet', coreFacet),
    ...changes.getFacetCuts('DFMoveFacet', moveFacet),
    ...changes.getFacetCuts('DFCaptureFacet', captureFacet),
    ...changes.getFacetCuts('DFArtifactFacet', artifactFacet),
    ...changes.getFacetCuts('DFGetterFacet', getterFacet),
    ...changes.getFacetCuts('DFWhitelistFacet', whitelistFacet),
    ...changes.getFacetCuts('DFAdminFacet', adminFacet),
  ];

  const arenaFacetCuts = [
    ...changes.getFacetCuts('DFArenaCoreFacet', arenaCoreFacet),
    ...changes.getFacetCuts('DFArenaGetterFacet', arenaGetterFacet),
    ...changes.getFacetCuts('DFSpaceshipConfigFacet', spaceshipConfigFacet),
    ...changes.getFacetCuts('DFArenaTournamentFacet', tournamentFacet),
    ...changes.getFacetCuts('DFStartFacet', startFacet),
  ];

  if (isDev) {
    const debugFacet = await deployDebugFacet({}, libraries, hre);
    darkForestFacetCuts.push(...changes.getFacetCuts('DFDebugFacet', debugFacet));
  }

  const toCut = [...diamondSpecFacetCuts, ...darkForestFacetCuts, ...arenaFacetCuts];

  const diamondCut = await hre.ethers.getContractAt('DarkForest', diamond.address);

  const tokenBaseUri = `${
    isDev
      ? 'https://nft-test.zkga.me/token-uri/artifact/'
      : 'https://nft.zkga.me/token-uri/artifact/'
  }${hre.network.config?.chainId || 'unknown'}-${diamond.address}/`;

  const noInit = {
    address: hre.ethers.constants.AddressZero,
    calldata: '0x',
  };

  const diamondInit = await deployContract(
    'DFArenaInitialize',
    { },
    hre
  );

  // EIP-2535 specifies that the `diamondCut` function takes two optional
  // arguments: address _init and bytes calldata _calldata
  // These arguments are used to execute an arbitrary function using delegatecall
  // in order to set state variables in the diamond during deployment or an upgrade
  // More info here: https://eips.ethereum.org/EIPS/eip-2535#diamond-interface
  const initAddress = diamondInit.address;
  const initFunctionCall = diamondInit.interface.encodeFunctionData('init', [
    initializers,
    {
      allowListEnabled,
      artifactBaseURI: tokenBaseUri,
      allowedAddresses
    },
  ]);

  const cutTx = await diamondCut.diamondCut(toCut, initAddress, initFunctionCall);

  const cutRct = await cutTx.wait();
  if (!cutRct.status) {
    throw Error(`Diamond cut failed: ${cutTx.hash}`);
  }
  console.log(`Completed diamond cut with ${cutRct.gasUsed} gas`);

  const tx = await diamondCut.createLobby(initAddress, initFunctionCall);
  const rc = await tx.wait();
  if (!rc.events) throw Error('No event occurred');

  const event = rc.events.find((event: any) => event.event === 'LobbyCreated');
  if (!event || !event.args) throw Error('No event found');

  const lobbyAddress = event.args.lobbyAddress;

  if (!lobbyAddress) throw Error('No lobby address found');

  const arena = await hre.ethers.getContractAt('DarkForest', lobbyAddress);

  console.log(`Created & initialized Arena with ${rc.gasUsed} gas`);

  const startTx = await arena.start();
  const startRct = await startTx.wait();

  console.log(`start occurred with ${startRct.gasUsed} gas`);

  // const initTx = await arena.diamondCut([], initAddress, initFunctionCall);
  // const initRct = await initTx.wait();

  // console.log(`Initialized Arena with ${initRct.gasUsed} gas`);

  if (save) {
    await saveDeploy(
      {
        coreBlockNumber: rc.blockNumber,
        diamondAddress: arena.address,
        initAddress: diamondInit.address,
        libraries,
      },
      hre
    );
  }

  return [arena, diamondInit, rc, libraries] as const;
}

export async function deployArenaCoreFacet(
  {},
  { LibGameUtils, LibPlanet }: Libraries,
  hre: HardhatRuntimeEnvironment
) {
  const factory = await hre.ethers.getContractFactory('DFArenaCoreFacet', {
    libraries: {
      LibGameUtils,
      LibPlanet,
    },
  });

  const contract = await factory.deploy();
  await contract.deployTransaction.wait();
  console.log(`DFArenaCoreFacet deployed to: ${contract.address}`);
  return contract;
}

export async function deployArenaGetterFacet({}, {}: Libraries, hre: HardhatRuntimeEnvironment) {
  const factory = await hre.ethers.getContractFactory('DFArenaGetterFacet');
  const contract = await factory.deploy();
  await contract.deployTransaction.wait();
  console.log(`DFArenaGetterFacet deployed to: ${contract.address}`);
  return contract;
}

export async function deployArenaSpaceShipFacet(
  {},
  { LibGameUtils }: Libraries,
  hre: HardhatRuntimeEnvironment
) {
  const factory = await hre.ethers.getContractFactory('DFSpaceshipConfigFacet', {
    libraries: {
      LibGameUtils,
    },
  });
  const contract = await factory.deploy();
  await contract.deployTransaction.wait();
  console.log(`DFSpaceshipConfigFacet deployed to: ${contract.address}`);
  return contract;
}

export async function deployArenaTournamentFacet(
  {},
  {}: Libraries,
  hre: HardhatRuntimeEnvironment
) {
  const factory = await hre.ethers.getContractFactory('DFArenaTournamentFacet');
  const contract = await factory.deploy();
  await contract.deployTransaction.wait();
  console.log(`DFArenaTournamentFacet deployed to: ${contract.address}`);
  return contract;
}

export async function deployArenaStarterFacet(
  {},
  { LibGameUtils }: Libraries,
  hre: HardhatRuntimeEnvironment
) {
  const factory = await hre.ethers.getContractFactory('DFStartFacet', {
    libraries: {
      LibGameUtils,
    },
  });
  const contract = await factory.deploy();
  await contract.deployTransaction.wait();
  console.log(`DFStartFacet deployed to: ${contract.address}`);
  return contract;
}
