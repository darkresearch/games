/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface LibPlanetInterface extends ethers.utils.Interface {
  functions: {
    "applySpaceshipArrive(tuple,tuple,tuple,tuple)": FunctionFragment;
    "checkPlayerInit(uint256,uint256,uint256)": FunctionFragment;
    "getDefaultInitPlanetArgs(uint256,uint256,bool)": FunctionFragment;
    "getRefreshedPlanet(uint256,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "applySpaceshipArrive",
    values: [
      {
        isInitialized: boolean;
        id: BigNumberish;
        planetDiscoveredOn: BigNumberish;
        rarity: BigNumberish;
        planetBiome: BigNumberish;
        mintedAtTimestamp: BigNumberish;
        discoverer: string;
        artifactType: BigNumberish;
        activations: BigNumberish;
        lastActivated: BigNumberish;
        lastDeactivated: BigNumberish;
        wormholeTo: BigNumberish;
        controller: string;
      },
      {
        owner: string;
        range: BigNumberish;
        speed: BigNumberish;
        defense: BigNumberish;
        population: BigNumberish;
        populationCap: BigNumberish;
        populationGrowth: BigNumberish;
        silverCap: BigNumberish;
        silverGrowth: BigNumberish;
        silver: BigNumberish;
        planetLevel: BigNumberish;
        planetType: BigNumberish;
        isHomePlanet: boolean;
      },
      {
        isInitialized: boolean;
        createdAt: BigNumberish;
        lastUpdated: BigNumberish;
        perlin: BigNumberish;
        spaceType: BigNumberish;
        upgradeState0: BigNumberish;
        upgradeState1: BigNumberish;
        upgradeState2: BigNumberish;
        hatLevel: BigNumberish;
        hasTriedFindingArtifact: boolean;
        prospectedBlockNumber: BigNumberish;
        destroyed: boolean;
        spaceJunk: BigNumberish;
      },
      {
        isInitialized: boolean;
        pausers: BigNumberish;
        invader: string;
        invadeStartBlock: BigNumberish;
        capturer: string;
      }
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "checkPlayerInit",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getDefaultInitPlanetArgs",
    values: [BigNumberish, BigNumberish, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "getRefreshedPlanet",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "applySpaceshipArrive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "checkPlayerInit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDefaultInitPlanetArgs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRefreshedPlanet",
    data: BytesLike
  ): Result;

  events: {
    "ArtifactActivated(address,uint256,uint256)": EventFragment;
    "ArtifactDeactivated(address,uint256,uint256)": EventFragment;
    "PlanetUpgraded(address,uint256,uint256,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ArtifactActivated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ArtifactDeactivated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PlanetUpgraded"): EventFragment;
}

export type ArtifactActivatedEvent = TypedEvent<
  [string, BigNumber, BigNumber] & {
    player: string;
    artifactId: BigNumber;
    loc: BigNumber;
  }
>;

export type ArtifactDeactivatedEvent = TypedEvent<
  [string, BigNumber, BigNumber] & {
    player: string;
    artifactId: BigNumber;
    loc: BigNumber;
  }
>;

export type PlanetUpgradedEvent = TypedEvent<
  [string, BigNumber, BigNumber, BigNumber] & {
    player: string;
    loc: BigNumber;
    branch: BigNumber;
    toBranchLevel: BigNumber;
  }
>;

export class LibPlanet extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: LibPlanetInterface;

  functions: {
    applySpaceshipArrive(
      artifact: {
        isInitialized: boolean;
        id: BigNumberish;
        planetDiscoveredOn: BigNumberish;
        rarity: BigNumberish;
        planetBiome: BigNumberish;
        mintedAtTimestamp: BigNumberish;
        discoverer: string;
        artifactType: BigNumberish;
        activations: BigNumberish;
        lastActivated: BigNumberish;
        lastDeactivated: BigNumberish;
        wormholeTo: BigNumberish;
        controller: string;
      },
      planet: {
        owner: string;
        range: BigNumberish;
        speed: BigNumberish;
        defense: BigNumberish;
        population: BigNumberish;
        populationCap: BigNumberish;
        populationGrowth: BigNumberish;
        silverCap: BigNumberish;
        silverGrowth: BigNumberish;
        silver: BigNumberish;
        planetLevel: BigNumberish;
        planetType: BigNumberish;
        isHomePlanet: boolean;
      },
      planetExtendedInfo: {
        isInitialized: boolean;
        createdAt: BigNumberish;
        lastUpdated: BigNumberish;
        perlin: BigNumberish;
        spaceType: BigNumberish;
        upgradeState0: BigNumberish;
        upgradeState1: BigNumberish;
        upgradeState2: BigNumberish;
        hatLevel: BigNumberish;
        hasTriedFindingArtifact: boolean;
        prospectedBlockNumber: BigNumberish;
        destroyed: boolean;
        spaceJunk: BigNumberish;
      },
      planetExtendedInfo2: {
        isInitialized: boolean;
        pausers: BigNumberish;
        invader: string;
        invadeStartBlock: BigNumberish;
        capturer: string;
      },
      overrides?: CallOverrides
    ): Promise<
      [
        [
          string,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          boolean
        ] & {
          owner: string;
          range: BigNumber;
          speed: BigNumber;
          defense: BigNumber;
          population: BigNumber;
          populationCap: BigNumber;
          populationGrowth: BigNumber;
          silverCap: BigNumber;
          silverGrowth: BigNumber;
          silver: BigNumber;
          planetLevel: BigNumber;
          planetType: number;
          isHomePlanet: boolean;
        },
        [
          boolean,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean,
          BigNumber,
          boolean,
          BigNumber
        ] & {
          isInitialized: boolean;
          createdAt: BigNumber;
          lastUpdated: BigNumber;
          perlin: BigNumber;
          spaceType: number;
          upgradeState0: BigNumber;
          upgradeState1: BigNumber;
          upgradeState2: BigNumber;
          hatLevel: BigNumber;
          hasTriedFindingArtifact: boolean;
          prospectedBlockNumber: BigNumber;
          destroyed: boolean;
          spaceJunk: BigNumber;
        },
        [boolean, BigNumber, string, BigNumber, string] & {
          isInitialized: boolean;
          pausers: BigNumber;
          invader: string;
          invadeStartBlock: BigNumber;
          capturer: string;
        }
      ]
    >;

    checkPlayerInit(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _radius: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    getDefaultInitPlanetArgs(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _isHomePlanet: boolean,
      overrides?: CallOverrides
    ): Promise<
      [
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          number,
          boolean
        ] & {
          location: BigNumber;
          perlin: BigNumber;
          level: BigNumber;
          TIME_FACTOR_HUNDREDTHS: BigNumber;
          spaceType: number;
          planetType: number;
          isHomePlanet: boolean;
        }
      ]
    >;

    getRefreshedPlanet(
      location: BigNumberish,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [
          string,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          boolean
        ] & {
          owner: string;
          range: BigNumber;
          speed: BigNumber;
          defense: BigNumber;
          population: BigNumber;
          populationCap: BigNumber;
          populationGrowth: BigNumber;
          silverCap: BigNumber;
          silverGrowth: BigNumber;
          silver: BigNumber;
          planetLevel: BigNumber;
          planetType: number;
          isHomePlanet: boolean;
        },
        [
          boolean,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean,
          BigNumber,
          boolean,
          BigNumber
        ] & {
          isInitialized: boolean;
          createdAt: BigNumber;
          lastUpdated: BigNumber;
          perlin: BigNumber;
          spaceType: number;
          upgradeState0: BigNumber;
          upgradeState1: BigNumber;
          upgradeState2: BigNumber;
          hatLevel: BigNumber;
          hasTriedFindingArtifact: boolean;
          prospectedBlockNumber: BigNumber;
          destroyed: boolean;
          spaceJunk: BigNumber;
        },
        [boolean, BigNumber, string, BigNumber, string] & {
          isInitialized: boolean;
          pausers: BigNumber;
          invader: string;
          invadeStartBlock: BigNumber;
          capturer: string;
        },
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ],
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ]
      ] & {
        eventsToRemove: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ];
        artifactsToAdd: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ];
      }
    >;
  };

  applySpaceshipArrive(
    artifact: {
      isInitialized: boolean;
      id: BigNumberish;
      planetDiscoveredOn: BigNumberish;
      rarity: BigNumberish;
      planetBiome: BigNumberish;
      mintedAtTimestamp: BigNumberish;
      discoverer: string;
      artifactType: BigNumberish;
      activations: BigNumberish;
      lastActivated: BigNumberish;
      lastDeactivated: BigNumberish;
      wormholeTo: BigNumberish;
      controller: string;
    },
    planet: {
      owner: string;
      range: BigNumberish;
      speed: BigNumberish;
      defense: BigNumberish;
      population: BigNumberish;
      populationCap: BigNumberish;
      populationGrowth: BigNumberish;
      silverCap: BigNumberish;
      silverGrowth: BigNumberish;
      silver: BigNumberish;
      planetLevel: BigNumberish;
      planetType: BigNumberish;
      isHomePlanet: boolean;
    },
    planetExtendedInfo: {
      isInitialized: boolean;
      createdAt: BigNumberish;
      lastUpdated: BigNumberish;
      perlin: BigNumberish;
      spaceType: BigNumberish;
      upgradeState0: BigNumberish;
      upgradeState1: BigNumberish;
      upgradeState2: BigNumberish;
      hatLevel: BigNumberish;
      hasTriedFindingArtifact: boolean;
      prospectedBlockNumber: BigNumberish;
      destroyed: boolean;
      spaceJunk: BigNumberish;
    },
    planetExtendedInfo2: {
      isInitialized: boolean;
      pausers: BigNumberish;
      invader: string;
      invadeStartBlock: BigNumberish;
      capturer: string;
    },
    overrides?: CallOverrides
  ): Promise<
    [
      [
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        number,
        boolean
      ] & {
        owner: string;
        range: BigNumber;
        speed: BigNumber;
        defense: BigNumber;
        population: BigNumber;
        populationCap: BigNumber;
        populationGrowth: BigNumber;
        silverCap: BigNumber;
        silverGrowth: BigNumber;
        silver: BigNumber;
        planetLevel: BigNumber;
        planetType: number;
        isHomePlanet: boolean;
      },
      [
        boolean,
        BigNumber,
        BigNumber,
        BigNumber,
        number,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean,
        BigNumber,
        boolean,
        BigNumber
      ] & {
        isInitialized: boolean;
        createdAt: BigNumber;
        lastUpdated: BigNumber;
        perlin: BigNumber;
        spaceType: number;
        upgradeState0: BigNumber;
        upgradeState1: BigNumber;
        upgradeState2: BigNumber;
        hatLevel: BigNumber;
        hasTriedFindingArtifact: boolean;
        prospectedBlockNumber: BigNumber;
        destroyed: boolean;
        spaceJunk: BigNumber;
      },
      [boolean, BigNumber, string, BigNumber, string] & {
        isInitialized: boolean;
        pausers: BigNumber;
        invader: string;
        invadeStartBlock: BigNumber;
        capturer: string;
      }
    ]
  >;

  checkPlayerInit(
    _location: BigNumberish,
    _perlin: BigNumberish,
    _radius: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  getDefaultInitPlanetArgs(
    _location: BigNumberish,
    _perlin: BigNumberish,
    _isHomePlanet: boolean,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber, BigNumber, number, number, boolean] & {
      location: BigNumber;
      perlin: BigNumber;
      level: BigNumber;
      TIME_FACTOR_HUNDREDTHS: BigNumber;
      spaceType: number;
      planetType: number;
      isHomePlanet: boolean;
    }
  >;

  getRefreshedPlanet(
    location: BigNumberish,
    timestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      [
        string,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        number,
        boolean
      ] & {
        owner: string;
        range: BigNumber;
        speed: BigNumber;
        defense: BigNumber;
        population: BigNumber;
        populationCap: BigNumber;
        populationGrowth: BigNumber;
        silverCap: BigNumber;
        silverGrowth: BigNumber;
        silver: BigNumber;
        planetLevel: BigNumber;
        planetType: number;
        isHomePlanet: boolean;
      },
      [
        boolean,
        BigNumber,
        BigNumber,
        BigNumber,
        number,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean,
        BigNumber,
        boolean,
        BigNumber
      ] & {
        isInitialized: boolean;
        createdAt: BigNumber;
        lastUpdated: BigNumber;
        perlin: BigNumber;
        spaceType: number;
        upgradeState0: BigNumber;
        upgradeState1: BigNumber;
        upgradeState2: BigNumber;
        hatLevel: BigNumber;
        hasTriedFindingArtifact: boolean;
        prospectedBlockNumber: BigNumber;
        destroyed: boolean;
        spaceJunk: BigNumber;
      },
      [boolean, BigNumber, string, BigNumber, string] & {
        isInitialized: boolean;
        pausers: BigNumber;
        invader: string;
        invadeStartBlock: BigNumber;
        capturer: string;
      },
      [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber
      ],
      [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber
      ]
    ] & {
      eventsToRemove: [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber
      ];
      artifactsToAdd: [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber
      ];
    }
  >;

  callStatic: {
    applySpaceshipArrive(
      artifact: {
        isInitialized: boolean;
        id: BigNumberish;
        planetDiscoveredOn: BigNumberish;
        rarity: BigNumberish;
        planetBiome: BigNumberish;
        mintedAtTimestamp: BigNumberish;
        discoverer: string;
        artifactType: BigNumberish;
        activations: BigNumberish;
        lastActivated: BigNumberish;
        lastDeactivated: BigNumberish;
        wormholeTo: BigNumberish;
        controller: string;
      },
      planet: {
        owner: string;
        range: BigNumberish;
        speed: BigNumberish;
        defense: BigNumberish;
        population: BigNumberish;
        populationCap: BigNumberish;
        populationGrowth: BigNumberish;
        silverCap: BigNumberish;
        silverGrowth: BigNumberish;
        silver: BigNumberish;
        planetLevel: BigNumberish;
        planetType: BigNumberish;
        isHomePlanet: boolean;
      },
      planetExtendedInfo: {
        isInitialized: boolean;
        createdAt: BigNumberish;
        lastUpdated: BigNumberish;
        perlin: BigNumberish;
        spaceType: BigNumberish;
        upgradeState0: BigNumberish;
        upgradeState1: BigNumberish;
        upgradeState2: BigNumberish;
        hatLevel: BigNumberish;
        hasTriedFindingArtifact: boolean;
        prospectedBlockNumber: BigNumberish;
        destroyed: boolean;
        spaceJunk: BigNumberish;
      },
      planetExtendedInfo2: {
        isInitialized: boolean;
        pausers: BigNumberish;
        invader: string;
        invadeStartBlock: BigNumberish;
        capturer: string;
      },
      overrides?: CallOverrides
    ): Promise<
      [
        [
          string,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          boolean
        ] & {
          owner: string;
          range: BigNumber;
          speed: BigNumber;
          defense: BigNumber;
          population: BigNumber;
          populationCap: BigNumber;
          populationGrowth: BigNumber;
          silverCap: BigNumber;
          silverGrowth: BigNumber;
          silver: BigNumber;
          planetLevel: BigNumber;
          planetType: number;
          isHomePlanet: boolean;
        },
        [
          boolean,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean,
          BigNumber,
          boolean,
          BigNumber
        ] & {
          isInitialized: boolean;
          createdAt: BigNumber;
          lastUpdated: BigNumber;
          perlin: BigNumber;
          spaceType: number;
          upgradeState0: BigNumber;
          upgradeState1: BigNumber;
          upgradeState2: BigNumber;
          hatLevel: BigNumber;
          hasTriedFindingArtifact: boolean;
          prospectedBlockNumber: BigNumber;
          destroyed: boolean;
          spaceJunk: BigNumber;
        },
        [boolean, BigNumber, string, BigNumber, string] & {
          isInitialized: boolean;
          pausers: BigNumber;
          invader: string;
          invadeStartBlock: BigNumber;
          capturer: string;
        }
      ]
    >;

    checkPlayerInit(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _radius: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    getDefaultInitPlanetArgs(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _isHomePlanet: boolean,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, BigNumber, number, number, boolean] & {
        location: BigNumber;
        perlin: BigNumber;
        level: BigNumber;
        TIME_FACTOR_HUNDREDTHS: BigNumber;
        spaceType: number;
        planetType: number;
        isHomePlanet: boolean;
      }
    >;

    getRefreshedPlanet(
      location: BigNumberish,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [
          string,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          boolean
        ] & {
          owner: string;
          range: BigNumber;
          speed: BigNumber;
          defense: BigNumber;
          population: BigNumber;
          populationCap: BigNumber;
          populationGrowth: BigNumber;
          silverCap: BigNumber;
          silverGrowth: BigNumber;
          silver: BigNumber;
          planetLevel: BigNumber;
          planetType: number;
          isHomePlanet: boolean;
        },
        [
          boolean,
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean,
          BigNumber,
          boolean,
          BigNumber
        ] & {
          isInitialized: boolean;
          createdAt: BigNumber;
          lastUpdated: BigNumber;
          perlin: BigNumber;
          spaceType: number;
          upgradeState0: BigNumber;
          upgradeState1: BigNumber;
          upgradeState2: BigNumber;
          hatLevel: BigNumber;
          hasTriedFindingArtifact: boolean;
          prospectedBlockNumber: BigNumber;
          destroyed: boolean;
          spaceJunk: BigNumber;
        },
        [boolean, BigNumber, string, BigNumber, string] & {
          isInitialized: boolean;
          pausers: BigNumber;
          invader: string;
          invadeStartBlock: BigNumber;
          capturer: string;
        },
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ],
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ]
      ] & {
        eventsToRemove: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ];
        artifactsToAdd: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber
        ];
      }
    >;
  };

  filters: {
    "ArtifactActivated(address,uint256,uint256)"(
      player?: null,
      artifactId?: null,
      loc?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber],
      { player: string; artifactId: BigNumber; loc: BigNumber }
    >;

    ArtifactActivated(
      player?: null,
      artifactId?: null,
      loc?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber],
      { player: string; artifactId: BigNumber; loc: BigNumber }
    >;

    "ArtifactDeactivated(address,uint256,uint256)"(
      player?: null,
      artifactId?: null,
      loc?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber],
      { player: string; artifactId: BigNumber; loc: BigNumber }
    >;

    ArtifactDeactivated(
      player?: null,
      artifactId?: null,
      loc?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber],
      { player: string; artifactId: BigNumber; loc: BigNumber }
    >;

    "PlanetUpgraded(address,uint256,uint256,uint256)"(
      player?: null,
      loc?: null,
      branch?: null,
      toBranchLevel?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber, BigNumber],
      {
        player: string;
        loc: BigNumber;
        branch: BigNumber;
        toBranchLevel: BigNumber;
      }
    >;

    PlanetUpgraded(
      player?: null,
      loc?: null,
      branch?: null,
      toBranchLevel?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber, BigNumber],
      {
        player: string;
        loc: BigNumber;
        branch: BigNumber;
        toBranchLevel: BigNumber;
      }
    >;
  };

  estimateGas: {
    applySpaceshipArrive(
      artifact: {
        isInitialized: boolean;
        id: BigNumberish;
        planetDiscoveredOn: BigNumberish;
        rarity: BigNumberish;
        planetBiome: BigNumberish;
        mintedAtTimestamp: BigNumberish;
        discoverer: string;
        artifactType: BigNumberish;
        activations: BigNumberish;
        lastActivated: BigNumberish;
        lastDeactivated: BigNumberish;
        wormholeTo: BigNumberish;
        controller: string;
      },
      planet: {
        owner: string;
        range: BigNumberish;
        speed: BigNumberish;
        defense: BigNumberish;
        population: BigNumberish;
        populationCap: BigNumberish;
        populationGrowth: BigNumberish;
        silverCap: BigNumberish;
        silverGrowth: BigNumberish;
        silver: BigNumberish;
        planetLevel: BigNumberish;
        planetType: BigNumberish;
        isHomePlanet: boolean;
      },
      planetExtendedInfo: {
        isInitialized: boolean;
        createdAt: BigNumberish;
        lastUpdated: BigNumberish;
        perlin: BigNumberish;
        spaceType: BigNumberish;
        upgradeState0: BigNumberish;
        upgradeState1: BigNumberish;
        upgradeState2: BigNumberish;
        hatLevel: BigNumberish;
        hasTriedFindingArtifact: boolean;
        prospectedBlockNumber: BigNumberish;
        destroyed: boolean;
        spaceJunk: BigNumberish;
      },
      planetExtendedInfo2: {
        isInitialized: boolean;
        pausers: BigNumberish;
        invader: string;
        invadeStartBlock: BigNumberish;
        capturer: string;
      },
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    checkPlayerInit(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _radius: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDefaultInitPlanetArgs(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _isHomePlanet: boolean,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRefreshedPlanet(
      location: BigNumberish,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    applySpaceshipArrive(
      artifact: {
        isInitialized: boolean;
        id: BigNumberish;
        planetDiscoveredOn: BigNumberish;
        rarity: BigNumberish;
        planetBiome: BigNumberish;
        mintedAtTimestamp: BigNumberish;
        discoverer: string;
        artifactType: BigNumberish;
        activations: BigNumberish;
        lastActivated: BigNumberish;
        lastDeactivated: BigNumberish;
        wormholeTo: BigNumberish;
        controller: string;
      },
      planet: {
        owner: string;
        range: BigNumberish;
        speed: BigNumberish;
        defense: BigNumberish;
        population: BigNumberish;
        populationCap: BigNumberish;
        populationGrowth: BigNumberish;
        silverCap: BigNumberish;
        silverGrowth: BigNumberish;
        silver: BigNumberish;
        planetLevel: BigNumberish;
        planetType: BigNumberish;
        isHomePlanet: boolean;
      },
      planetExtendedInfo: {
        isInitialized: boolean;
        createdAt: BigNumberish;
        lastUpdated: BigNumberish;
        perlin: BigNumberish;
        spaceType: BigNumberish;
        upgradeState0: BigNumberish;
        upgradeState1: BigNumberish;
        upgradeState2: BigNumberish;
        hatLevel: BigNumberish;
        hasTriedFindingArtifact: boolean;
        prospectedBlockNumber: BigNumberish;
        destroyed: boolean;
        spaceJunk: BigNumberish;
      },
      planetExtendedInfo2: {
        isInitialized: boolean;
        pausers: BigNumberish;
        invader: string;
        invadeStartBlock: BigNumberish;
        capturer: string;
      },
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    checkPlayerInit(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _radius: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDefaultInitPlanetArgs(
      _location: BigNumberish,
      _perlin: BigNumberish,
      _isHomePlanet: boolean,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRefreshedPlanet(
      location: BigNumberish,
      timestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
