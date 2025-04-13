// This file uses a `organize-imports-ignore` comment because we
// need to control the ordering that Hardhat tasks are registered

// organize-imports-ignore

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-abi-exporter';
import 'hardhat-diamond-abi';
// Must be registered after hardhat-diamond-abi
import '@typechain/hardhat';
import 'hardhat-circom';
import 'hardhat-contract-sizer';
import '@solidstate/hardhat-4byte-uploader';
import { extendEnvironment, HardhatUserConfig } from 'hardhat/config';
import { lazyObject } from 'hardhat/plugins';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as diamondUtils from './utils/diamond';
import * as path from 'path';
import * as settings from './settings';
import { decodeContracts, decodeInitializers, decodeAdminPlanets } from '@darkforest_eth/settings';
import './tasks/arena-deploy';
import './tasks/arena-upgrade';
import './tasks/artifact';
import './tasks/circom';
import './tasks/compile';
import './tasks/debug';
import './tasks/deploy';
import './tasks/game';
import './tasks/lobby';
import './tasks/subgraph';
import './tasks/upgrades';
import './tasks/utils';
import './tasks/wallet';
import './tasks/whitelist';
import './tasks/faucet';

require('dotenv').config();

const { DEPLOYER_MNEMONIC, ADMIN_PUBLIC_ADDRESS } = process.env;
const { ALTLAYER_DEPLOYER_KEY, ALTLAYER_RPC_URL, ALTLAYER_CHAIN_ID } = process.env;
const { ANVIL_DEPLOYER_KEY, ANVIL_RPC_URL, ANVIL_CHAIN_ID } = process.env;

const AbiItemsToIgnore = [
  {
    facet: 'DFCoreFacet',
    functions: ['initializePlayer', 'giveceShips'],
    events: ['PlayerInitialized', 'LocationRevealed'],
  },
  {
    facet: 'DFAdminFacet',
    events: ['AdminPlanetCreated', 'PauseStateChanged'],
  },
  // {
  //   facet: 'DFArenaGetterFacet',
  //   functions: ['getArenaConstants']
  // },
  {
    facet: 'DFArtifactFacet',
    events: ['ArtifactFound'],
  },
  {
    facet: 'DFMoveFacet',
    events: ['GameStarted'],
  }
];

// Warning: If the facet is not in the `facets` directory, getFullyQualifiedFacetName will not work.
const getFullyQualifiedFacetName = (facet: string) => {
  return `contracts/facets/${facet}.sol:${facet}`;
};

// Ensure we can lookup the needed workspace packages
const packageDirs = {
  '@darkforest_eth/contracts': settings.resolvePackageDir('@darkforest_eth/contracts'),
  '@darkforest_eth/snarks': settings.resolvePackageDir('@darkforest_eth/snarks'),
};

extendEnvironment((env: HardhatRuntimeEnvironment) => {
  env.DEPLOYER_MNEMONIC = DEPLOYER_MNEMONIC;
  // cant easily lookup deployer.address here so well have to be ok with undefined and check it later
  env.ADMIN_PUBLIC_ADDRESS = ADMIN_PUBLIC_ADDRESS;

  env.packageDirs = packageDirs;

  env.contracts = lazyObject(() => {
    const contracts = require('@darkforest_eth/contracts');
    return settings.parse(decodeContracts, contracts);
  });

  env.initializers = lazyObject(() => {
    const { initializers = {} } = settings.load(env.network.name);
    return settings.parse(decodeInitializers, initializers);
  });

  env.adminPlanets = lazyObject(() => {
    const { planets = [] } = settings.load(env.network.name);
    return settings.parse(decodeAdminPlanets, planets);
  });
});

// The xdai config, but it isn't added to networks unless we have a DEPLOYER_MNEMONIC
const xdai = {
  url: process.env.XDAI_RPC_URL ?? 'https://rpc-df.xdaichain.com/',
  accounts: {
    mnemonic: DEPLOYER_MNEMONIC,
  },
  chainId: 100,
  gasMultiplier: 5,
};

// altlayer
const altlayer = {
  url: ALTLAYER_RPC_URL as string,
  accounts: [ALTLAYER_DEPLOYER_KEY as string],
  chainId: parseInt(ALTLAYER_CHAIN_ID as string),
}

// anvil
const anvil = {
  url: ANVIL_RPC_URL as string,
  accounts: [ANVIL_DEPLOYER_KEY as string],
  chainId: parseInt(ANVIL_CHAIN_ID as string),
}

// The mainnet config, but it isn't added to networks unless we have a DEPLOYER_MNEMONIC
const mainnet = {
  // Brian's Infura endpoint (free tier)
  url: 'https://mainnet.infura.io/v3/5459b6d562eb47f689c809fe0b78408e',
  accounts: {
    mnemonic: DEPLOYER_MNEMONIC,
  },
  chainId: 1,
};
const kovan_optimism = {
  url: 'https://kovan.optimism.io',
  accounts: {
    mnemonic: DEPLOYER_MNEMONIC,
  },
  chainId: 69,
  gasLimit: 15000000,
  gasMultiplier: 5,
};

const gnosis_optimism = {
  url: 'https://optimism.gnosischain.com',
  accounts: {
    mnemonic: DEPLOYER_MNEMONIC,
  },
  chainId: 300,
  gasLimit: 15000000,
  gasMultiplier: 5,
};

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    // Check for a DEPLOYER_MNEMONIC before we add xdai/mainnet network to the list of networks
    // Ex: If you try to deploy to xdai without DEPLOYER_MNEMONIC, you'll see this error:
    // > Error HH100: Network xdai doesn't exist
    ...(DEPLOYER_MNEMONIC ? { gnosis_optimism } : undefined),
    ...(DEPLOYER_MNEMONIC ? { kovan_optimism } : undefined),
    ...(DEPLOYER_MNEMONIC ? { xdai } : undefined),
    ...(DEPLOYER_MNEMONIC ? { mainnet } : undefined),
    ...{ altlayer },
    ...{ anvil },
    localhost: {
      url: 'http://0.0.0.0:8545/',
      accounts: {
        // Same mnemonic used in the .env.example
        mnemonic: 'change typical hire slam amateur loan grid fix drama electric seed label',
      },
      blockGasLimit: 15000000,
      chainId: 31337,
    },
    // Used when you dont specify a network on command line, like in tests
    hardhat: {
      accounts: [
        // from/deployer is default the first address in accounts
        {
          // trunk-ignore(gitleaks/generic-api-key)
          privateKey: '0x044C7963E9A89D4F8B64AB23E02E97B2E00DD57FCB60F316AC69B77135003AEF',
          balance: '100000000000000000000',
        },
        // user1 in tests
        {
          // trunk-ignore(gitleaks/generic-api-key)
          privateKey: '0x523170AAE57904F24FFE1F61B7E4FF9E9A0CE7557987C2FC034EACB1C267B4AE',
          balance: '100000000000000000000',
        },
        // user2 in tests
        // admin account
        {
          // trunk-ignore(gitleaks/generic-api-key)
          privateKey: '0x67195c963ff445314e667112ab22f4a7404bad7f9746564eb409b9bb8c6aed32',
          balance: '100000000000000000000',
        },
      ],
      blockGasLimit: 16777215,
      mining: {
        auto: false,
        interval: 1000,
      },
    },
  },
  solidity: {
    version: '0.8.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  circom: {
    inputBasePath: '../circuits/',
    outputBasePath: packageDirs['@darkforest_eth/snarks'],
    ptau: 'pot15_final.ptau',
    circuits: [
      {
        name: 'init',
        circuit: 'init/circuit.circom',
        input: 'init/input.json',
        beacon: '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      },
      {
        name: 'move',
        circuit: 'move/circuit.circom',
        input: 'move/input.json',
        beacon: '0000000005060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      },
      {
        name: 'biomebase',
        circuit: 'biomebase/circuit.circom',
        input: 'biomebase/input.json',
        beacon: '0000000005060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      },
      {
        name: 'reveal',
        circuit: 'reveal/circuit.circom',
        input: 'reveal/input.json',
        beacon: '0000000005060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      },
      {
        name: 'whitelist',
        circuit: 'whitelist/circuit.circom',
        input: 'whitelist/input.json',
        beacon: '0000000005060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      },
    ],
  },
  typechain: {
    outDir: path.join(packageDirs['@darkforest_eth/contracts'], 'typechain'),
    target: 'ethers-v5',
  },
  diamondAbi: {
    // This plugin will combine all ABIs from any Smart Contract with `Facet` in the name or path and output it as `DarkForest.json`
    name: 'DarkForest',
    include: ['Facet'],
    // We explicitly set `strict` to `true` because we want to validate our facets don't accidentally provide overlapping functions
    strict: true,
    // We use our diamond utils to filter some functions we ignore from the combined ABI
    filter(abiElement: unknown, index: number, abi: unknown[], fullyQualifiedName: string) {
      const facetToIgnore = AbiItemsToIgnore.find(
        (value) => getFullyQualifiedFacetName(value.facet) === fullyQualifiedName
      );
      // @ts-expect-error because abiElement is type unknown
      if (facetToIgnore?.functions?.includes(abiElement.name)) return false;
      // @ts-expect-error because abiElement is type unknown
      if (facetToIgnore?.events?.includes(abiElement.name)) return false;

      const signature = diamondUtils.toSignature(abiElement);
      return diamondUtils.isIncluded(fullyQualifiedName, signature);
    },
  },
  abiExporter: {
    // This plugin will copy the ABI from the DarkForest artifact into our `@darkforest_eth/contracts` package as `abis/DarkForest.json`
    path: path.join(packageDirs['@darkforest_eth/contracts'], 'abis'),
    runOnCompile: true,
    // We don't want additional directories created, so we explicitly set the `flat` option to `true`
    flat: true,
    // We **only** want to copy the DarkForest ABI (which is the Diamond ABI we generate) and the initializer ABI to this folder, so we limit the matched files with the `only` option
    only: [':DarkForest$', ':DFArenaInitialize$', ':DFArenaFaucet$'],
  },
};

export default config;
