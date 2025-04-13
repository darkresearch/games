/**
 * @hidden
 */
import type { Abstract } from './utility';
/**
 * The user can choose to have the client automatically choose a gas price for their transactions,
 * depending on how much they are willing to pay and how fast they want their transactions to confirm.
 */
export declare type AutoGasSetting = Abstract<string, 'AutoGasSetting'>;
export declare const AutoGasSetting: {
    Slow: AutoGasSetting;
    Average: AutoGasSetting;
    Fast: AutoGasSetting;
};
export declare type Setting = Abstract<string, 'Setting'>;
/**
 * Each setting has a unique identifier. Each account gets to store its own local storage setting,
 * per instance of the dark forest contract that it's connected to.
 */
export declare const Setting: {
    OptOutMetrics: Setting;
    AutoApproveNonPurchaseTransactions: Setting;
    DrawChunkBorders: Setting;
    HighPerformanceRendering: Setting;
    MoveNotifications: Setting;
    GasFeeGwei: Setting;
    TerminalVisible: Setting;
    HasAcceptedPluginRisk: Setting;
    FoundPirates: Setting;
    TutorialCompleted: Setting;
    FoundSilver: Setting;
    FoundSilverBank: Setting;
    FoundTradingPost: Setting;
    FoundComet: Setting;
    FoundArtifact: Setting;
    FoundDeepSpace: Setting;
    FoundSpace: Setting;
    NewPlayer: Setting;
    MiningCores: Setting;
    ShowTutorial: Setting;
    ShowSpectatorInfo: Setting;
    ShowArenaBriefing: Setting;
    IsMining: Setting;
    DisableDefaultShortcuts: Setting;
    ExperimentalFeatures: Setting;
    DisableEmojiRendering: Setting;
    DisableHatRendering: Setting;
    AutoClearConfirmedTransactionsAfterSeconds: Setting;
    AutoClearRejectedTransactionsAfterSeconds: Setting;
    RendererColorInnerNebula: Setting;
    RendererColorNebula: Setting;
    RendererColorSpace: Setting;
    RendererColorDeepSpace: Setting;
    RendererColorDeadSpace: Setting;
    DisableFancySpaceEffect: Setting;
    ForceReloadEmbeddedPlugins: Setting;
};
