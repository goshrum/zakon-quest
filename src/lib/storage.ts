// A thin wrapper over localStorage for persisting progress.
// The logic stays in pure functions; this file only does I/O.

import type { CardState } from "./srs";
import { emptyStats, migrateStats, type LifetimeStats } from "./stats";

const KEY = "zakon-quest:progress:v1";

export interface Progress {
  xp: number;
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  cards: Record<string, CardState>;
  /** Lifetime statistics, including the per-category accuracy breakdown. */
  stats: LifetimeStats;
}

export function emptyProgress(): Progress {
  return {
    xp: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    bestStreak: 0,
    cards: {},
    stats: emptyStats(),
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const base = { ...emptyProgress(), ...parsed, cards: parsed.cards ?? {} };
    // Migrate stats: older saves had no `stats` block, so seed it from the
    // legacy top-level totals (category breakdown starts empty and fills in).
    base.stats = migrateStats(
      parsed.stats ?? {
        totalAnswered: base.totalAnswered,
        totalCorrect: base.totalCorrect,
        bestStreak: base.bestStreak,
        byCategory: {},
      },
    );
    return base;
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // localStorage may be unavailable (private mode) — silently ignore.
  }
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
