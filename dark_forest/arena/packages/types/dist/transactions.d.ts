import type { Contract } from 'ethers';
import type { LiteralUnion } from 'type-fest';
import type { ArtifactId, EthAddress, LocationId } from './identifier';
import type { WorldLocation } from './world';
/**
 * @hidden
 */
export declare type ContractMethodName = 'revealLocation' | 'initializePlayer' | 'move' | 'upgradePlanet' | 'buyHat' | 'transferPlanet' | 'findArtifact' | 'prospectPlanet' | 'depositArtifact' | 'withdrawArtifact' | 'activateArtifact' | 'deactivateArtifact' | 'withdrawSilver' | 'useKey' | 'adminUseKey' | 'addKeys' | 'giveSpaceShips' | 'createLobby' | 'invadePlanet' | 'capturePlanet' | "claimVictory" | "createPlanet" | "createArenaPlanet" | "ready" | "notReady";
export declare type EthTxStatus = 'Init' | 'Processing' | 'Prioritized' | 'Submit' | 'Confirm' | 'Fail' | 'Cancel';
/**
 * The intent of this type is to represent a transaction that will occur on the blockchain in a way
 * that the game understands. This should usually be accessed as a member of {@link Transaction}.
 * @hidden
 */
export declare type TxIntent = {
    contract: Contract;
    methodName: LiteralUnion<ContractMethodName, string>;
    args: Promise<unknown[]>;
};
/**
 * @hidden
 */
export declare type UnconfirmedInit = TxIntent & {
    methodName: 'initializePlayer';
    locationId: LocationId;
    location: WorldLocation;
};
/**
 * @hidden
 */
export declare type UnconfirmedMove = TxIntent & {
    methodName: 'move';
    from: LocationId;
    to: LocationId;
    forces: number;
    silver: number;
    abandoning: boolean;
    artifact?: ArtifactId;
};
/**
 * @hidden
 */
export declare type UnconfirmedFindArtifact = TxIntent & {
    methodName: 'findArtifact';
    planetId: LocationId;
};
/**
 * @hidden
 */
export declare type UnconfirmedProspectPlanet = TxIntent & {
    methodName: 'prospectPlanet';
    planetId: LocationId;
};
/**
 * @hidden
 */
export declare type UnconfirmedPlanetTransfer = TxIntent & {
    methodName: 'transferPlanet';
    planetId: LocationId;
    newOwner: EthAddress;
};
/**
 * @hidden
 */
export declare type UnconfirmedUpgrade = TxIntent & {
    methodName: 'upgradePlanet';
    locationId: LocationId;
    upgradeBranch: number;
};
/**
 * @hidden
 */
export declare type UnconfirmedBuyHat = TxIntent & {
    methodName: 'buyHat';
    locationId: LocationId;
};
/**
 * @hidden
 */
export declare type UnconfirmedDepositArtifact = TxIntent & {
    methodName: 'depositArtifact';
    locationId: LocationId;
    artifactId: ArtifactId;
};
/**
 * @hidden
 */
export declare type UnconfirmedWithdrawArtifact = TxIntent & {
    methodName: 'withdrawArtifact';
    locationId: LocationId;
    artifactId: ArtifactId;
};
/**
 * @hidden
 */
export declare type UnconfirmedActivateArtifact = TxIntent & {
    methodName: 'activateArtifact';
    locationId: LocationId;
    artifactId: ArtifactId;
    wormholeTo?: LocationId;
};
/**
 * @hidden
 */
export declare type UnconfirmedDeactivateArtifact = TxIntent & {
    methodName: 'deactivateArtifact';
    locationId: LocationId;
    artifactId: ArtifactId;
};
/**
 * @hidden
 */
export declare type UnconfirmedWithdrawSilver = TxIntent & {
    methodName: 'withdrawSilver';
    locationId: LocationId;
    amount: number;
};
/**
 * @hidden
 */
export declare type UnconfirmedReveal = TxIntent & {
    methodName: 'revealLocation';
    locationId: LocationId;
    location: WorldLocation;
};
/**
 * @hidden
 */
export declare type UnconfirmedAddKeys = TxIntent & {
    methodName: 'addKeys';
};
/**
 * @hidden
 */
export declare type UnconfirmedUseKey = TxIntent & {
    methodName: 'useKey';
};
/**
 * @hidden
 */
export declare type UnconfirmedAdminUseKey = TxIntent & {
    methodName: 'adminUseKey';
};
/**
 * @hidden
 */
export declare type UnconfirmedGetShips = TxIntent & {
    methodName: 'giveSpaceShips';
    locationId: LocationId;
};
/**
 * @hidden
 */
export declare type UnconfirmedCreateLobby = TxIntent & {
    methodName: 'createLobby';
};
/**
 * @hidden
 */
export declare type UnconfirmedStartLobby = TxIntent & {
    methodName: 'start';
};
/**
 * @hidden
 */
export declare type UnconfirmedInvadePlanet = TxIntent & {
    methodName: 'invadePlanet';
    locationId: LocationId;
};
/**
 * @hidden
 */
export declare type UnconfirmedCapturePlanet = TxIntent & {
    methodName: 'capturePlanet';
    locationId: LocationId;
};
/**
 * @hidden
 */
export declare type UnconfirmedClaimVictory = TxIntent & {
    methodName: 'claimVictory';
};
/**
 * @hidden
 */
export declare type UnconfirmedCreateArenaPlanet = TxIntent & {
    methodName: 'createArenaPlanet';
};
/**
 * @hidden
 */
export declare type UnconfirmedReady = TxIntent & {
    methodName: 'ready';
};
/**
 * @hidden
 */
export declare type UnconfirmedNotReady = TxIntent & {
    methodName: 'notReady';
};
