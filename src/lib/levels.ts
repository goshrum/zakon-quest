// Player levels and ranks based on accumulated XP. Pure functions.

export interface Level {
  index: number;
  title: string;
  /** Minimum XP required to reach the level. */
  minXp: number;
}

// Fun legal ranks: rising from newcomer to judge and beyond.
export const LEVELS: Level[] = [
  { index: 0, title: "Newcomer", minXp: 0 },
  { index: 1, title: "Law Student", minXp: 500 },
  { index: 2, title: "Legal Counsel", minXp: 1500 },
  { index: 3, title: "Attorney", minXp: 3500 },
  { index: 4, title: "Prosecutor", minXp: 6500 },
  { index: 5, title: "Judge", minXp: 11000 },
  { index: 6, title: "Supreme Court Justice", minXp: 18000 },
];

/** Returns the current level for a given XP. */
export function levelForXp(xp: number): Level {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  return current;
}

/** Next level, or null if the maximum has been reached. */
export function nextLevel(xp: number): Level | null {
  const current = levelForXp(xp);
  return LEVELS[current.index + 1] ?? null;
}

/**
 * Progress towards the next level, from 0 to 1.
 * Always 1 at the maximum level.
 */
export function levelProgress(xp: number): number {
  const current = levelForXp(xp);
  const next = nextLevel(xp);
  if (!next) return 1;
  const span = next.minXp - current.minXp;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (xp - current.minXp) / span));
}
