import { BigNumber } from "ethers";
import { BadgeType } from "./badges";
import { BadgeSet } from "./graph_types";
import { EthAddress } from "./identifier";
export interface SeasonHistory {
    seasonId: number;
    rank: number;
    score: number;
    players: number;
    grandPrixs: GrandPrixHistory[];
}
export interface GrandPrixHistory {
    configHash: string;
    rank: number;
    score: number;
    players: number;
    badges: ConfigBadge[];
}
export interface CleanConfigPlayer {
    id: string;
    address: string;
    duration: number;
    moves: number;
    startTime: number;
    endTime: number;
    badges: ConfigBadge[];
    configHash: string;
    gamesStarted: number;
    gamesFinished: number;
    score: number;
}
export interface ConfigBadge {
    configHash: string;
    type: BadgeType;
}
export interface SeasonBadge {
    configHash: string;
    badge: BadgeType;
    scoringConfigHash: string;
}
export interface UniquePlayerBadges {
    [type: BadgeType]: ConfigBadge;
}
export interface SeasonPlayers {
    [address: string]: CleanConfigPlayer[];
}
export interface GrandPrixPlayers {
    [configHash: string]: CleanConfigPlayer[];
}
export interface SeasonScore {
    player: string;
    score: number;
    grandPrixsFinished: number;
}
export interface Wallbreaker {
    configHash: string;
    player: string;
    duration: number;
    arenaAddress: string;
}
export interface GrandPrixResult {
    bestTime: number;
    moves: number;
    badges: BadgeSet;
}
export interface GrandPrixMetadata {
    seasonId: number;
    configHash: string;
    startTime: number;
    endTime: number;
    parentAddress: EthAddress;
}
export interface RegistryResponse {
    configHash: string;
    startTime: BigNumber;
    endTime: BigNumber;
    parentAddress: string;
    seasonId: BigNumber;
}
