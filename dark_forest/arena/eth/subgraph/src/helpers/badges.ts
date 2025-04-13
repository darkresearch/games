import { Arena, ArenaPlayer, Badge, ConfigPlayer } from '../../generated/schema';

import { NICE, BASED, OUCH, START_ENGINE } from './constants';

export interface BadgeItems {
  startYourEngine: bool;
  nice: bool;
  based: bool;
  ouch: bool;
}
export function updateBadge(
  allTimeBadges: Badge,
  arena: Arena,
  arenaPlayer: ArenaPlayer,
  configPlayer: ConfigPlayer
): void {
  // Only update allTimeBadges if condition is met
  if (configPlayer.gamesFinished == START_ENGINE) {
    allTimeBadges.startYourEngine = true;
  }
  if (arenaPlayer.moves == NICE) {
    allTimeBadges.nice = true;
  }
  if (arenaPlayer.moves == BASED) {
    allTimeBadges.based = true;
  }
  if (arena.duration > OUCH) {
    allTimeBadges.ouch = true;
  }
  allTimeBadges.save();
}
