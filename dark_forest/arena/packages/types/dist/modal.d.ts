import type { PluginId } from './plugin';
import type { Abstract } from './utility';
/**
 * Modals can either be built into the game, or spawned by a plugin.
 */
export declare type ModalId = ModalName | PluginId;
/**
 * Modals built into the game have a human-readable name.
 */
export declare type ModalName = Abstract<string, 'ModalName'>;
export declare const ModalName: {
    Help: ModalName;
    PlanetDetails: ModalName;
    Leaderboard: ModalName;
    PlanetDex: ModalName;
    UpgradeDetails: ModalName;
    TwitterVerify: ModalName;
    Broadcast: ModalName;
    Hats: ModalName;
    Settings: ModalName;
    YourArtifacts: ModalName;
    ManageArtifacts: ModalName;
    Plugins: ModalName;
    PluginWarning: ModalName;
    PluginEditor: ModalName;
    PlanetContextPane: ModalName;
    TransactionLog: ModalName;
    WithdrawSilver: ModalName;
    Diagnostics: ModalName;
    ArtifactConversation: ModalName;
    ArtifactDetails: ModalName;
    MapShare: ModalName;
    ManageAccount: ModalName;
    Onboarding: ModalName;
    Private: ModalName;
    Survey: ModalName;
    WaitingRoom: ModalName;
};
export declare type CursorState = Abstract<string, 'CursorState'>;
export declare const CursorState: {
    Normal: CursorState;
    TargetingExplorer: CursorState;
    TargetingForces: CursorState;
};
export declare type ModalManagerEvent = Abstract<string, 'ModalManagerEvent'>;
export declare const ModalManagerEvent: {
    StateChanged: string;
    MiningCoordsUpdate: string;
};
export declare type TooltipName = Abstract<string, 'TooltipName'>;
export declare const TooltipName: {
    SilverGrowth: TooltipName;
    SilverCap: TooltipName;
    Silver: TooltipName;
    TwitterHandle: TooltipName;
    Bonus: TooltipName;
    MinEnergy: TooltipName;
    Time50: TooltipName;
    Time90: TooltipName;
    Pirates: TooltipName;
    Upgrades: TooltipName;
    PlanetRank: TooltipName;
    MaxLevel: TooltipName;
    FindArtifact: TooltipName;
    ArtifactStored: TooltipName;
    SelectedSilver: TooltipName;
    Rank: TooltipName;
    Score: TooltipName;
    MiningPause: TooltipName;
    MiningTarget: TooltipName;
    HashesPerSec: TooltipName;
    CurrentMining: TooltipName;
    HoverPlanet: TooltipName;
    SilverProd: TooltipName;
    TimeUntilActivationPossible: TooltipName;
    DepositArtifact: TooltipName;
    DeactivateArtifact: TooltipName;
    WithdrawArtifact: TooltipName;
    ActivateArtifact: TooltipName;
    RetryTransaction: TooltipName;
    CancelTransaction: TooltipName;
    PrioritizeTransaction: TooltipName;
    DefenseMultiplier: TooltipName;
    EnergyCapMultiplier: TooltipName;
    EnergyGrowthMultiplier: TooltipName;
    RangeMultiplier: TooltipName;
    SpeedMultiplier: TooltipName;
    BonusEnergyCap: TooltipName;
    BonusEnergyGro: TooltipName;
    BonusRange: TooltipName;
    BonusSpeed: TooltipName;
    BonusDefense: TooltipName;
    BonusSpaceJunk: TooltipName;
    Energy: TooltipName;
    EnergyGrowth: TooltipName;
    Range: TooltipName;
    Speed: TooltipName;
    Defense: TooltipName;
    SpaceJunk: TooltipName;
    Abandon: TooltipName;
    Clowntown: TooltipName;
    ArtifactBuff: TooltipName;
    ModalHelp: TooltipName;
    ModalPlanetDetails: TooltipName;
    ModalLeaderboard: TooltipName;
    ModalPlanetDex: TooltipName;
    ModalUpgradeDetails: TooltipName;
    ModalTwitterVerification: TooltipName;
    ModalTwitterBroadcast: TooltipName;
    ModalHats: TooltipName;
    ModalSettings: TooltipName;
    ModalYourArtifacts: TooltipName;
    ModalFindArtifact: TooltipName;
    ModalPlugins: TooltipName;
    ModalWithdrawSilver: TooltipName;
    NetworkHealth: TooltipName;
    WithdrawSilverButton: TooltipName;
    Invadable: TooltipName;
    Capturable: TooltipName;
    TargetPlanet: TooltipName;
    SpawnPlanet: TooltipName;
    Blocked: TooltipName;
    /**
     * So that you can render a tooltip without anything, and control its contents entirely via the
     * {@link TooltipTriggerProps#extraContent} prop field.
     */
    Empty: TooltipName;
};
/**
 * Contains metadata on modals in the game. Meant to store coordinates and state. Is
 * uniquely identified by a ModalId, which typically either the modalId of a given modal pane, or
 * plugin id.
 */
export interface ModalPosition {
    x?: number;
    y?: number;
    state: 'open' | 'closed' | 'minimized';
    modalId: ModalId;
}
export declare type ModalPositions = Map<ModalId, ModalPosition>;
