import { Abstract } from './utility';
export declare type BadgeType = Abstract<string, 'BadgeType'>;
export declare const BadgeType: {
    readonly StartYourEngine: BadgeType;
    readonly Wallbreaker: BadgeType;
    readonly Tree: BadgeType;
    readonly Nice: BadgeType;
    readonly Sleepy: BadgeType;
};
export declare type GrandPrixBadge = {
    configHash: string;
    badge: BadgeType;
};
