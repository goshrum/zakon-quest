// Lifetime player statistics. Pure functions only — no I/O, no side effects.
// These operate on plain data so they can be unit-tested in isolation and
// reused by the storage layer and the UI.

import type { Category } from "../data/types";

/** Per-category tally of answers. */
export interface CategoryTally {
  total: number;
  correct: number;
}

/**
 * Lifetime stats persisted across rounds. This is intentionally a flat,
 * serialisable shape so it survives a JSON round-trip in localStorage.
 */
export interface LifetimeStats {
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  /** Accuracy tally per legal category, keyed by Category. */
  byCategory: Partial<Record<Category, CategoryTally>>;
}

/** A fresh, zeroed stats object. */
export function emptyStats(): LifetimeStats {
  return { totalAnswered: 0, totalCorrect: 0, bestStreak: 0, byCategory: {} };
}

/**
 * Normalises a possibly-partial or legacy stats object into a complete one,
 * filling in any missing fields with safe defaults. Tolerates `undefined`,
 * `null`, and objects missing some or all keys (forward/backward migration).
 */
export function migrateStats(raw: Partial<LifetimeStats> | null | undefined): LifetimeStats {
  const base = emptyStats();
  if (!raw || typeof raw !== "object") return base;

  const byCategory: Partial<Record<Category, CategoryTally>> = {};
  const rawByCat = raw.byCategory;
  if (rawByCat && typeof rawByCat === "object") {
    for (const key of Object.keys(rawByCat) as Category[]) {
      const tally = rawByCat[key];
      if (!tally || typeof tally !== "object") continue;
      const total = numOr(tally.total, 0);
      const correct = numOr(tally.correct, 0);
      // Clamp so a corrupt entry can never report >100% accuracy.
      byCategory[key] = { total: Math.max(0, total), correct: Math.max(0, Math.min(correct, total)) };
    }
  }

  return {
    totalAnswered: Math.max(0, numOr(raw.totalAnswered, 0)),
    totalCorrect: Math.max(0, numOr(raw.totalCorrect, 0)),
    bestStreak: Math.max(0, numOr(raw.bestStreak, 0)),
    byCategory,
  };
}

/** Input describing a single answered question. */
export interface AnswerEvent {
  category: Category;
  correct: boolean;
  /** The player's current streak length AFTER this answer. */
  streak: number;
}

/**
 * Returns a NEW stats object reflecting one answered question. The input is not
 * mutated, which keeps this safe to call from anywhere and easy to test.
 */
export function updateStats(prev: LifetimeStats, event: AnswerEvent): LifetimeStats {
  const next = migrateStats(prev);
  next.totalAnswered += 1;
  if (event.correct) next.totalCorrect += 1;
  next.bestStreak = Math.max(next.bestStreak, event.streak);

  const existing = next.byCategory[event.category] ?? { total: 0, correct: 0 };
  next.byCategory[event.category] = {
    total: existing.total + 1,
    correct: existing.correct + (event.correct ? 1 : 0),
  };
  return next;
}

/** Overall accuracy as an integer percentage (0..100). */
export function overallAccuracy(stats: LifetimeStats): number {
  return accuracyOf(stats.totalCorrect, stats.totalAnswered);
}

export interface CategoryAccuracy {
  category: Category;
  total: number;
  correct: number;
  /** Integer percentage 0..100; 0 when no questions answered. */
  accuracy: number;
}

/**
 * Accuracy breakdown per category, only for categories that have at least one
 * answered question, sorted by most-answered first (ties broken by accuracy).
 */
export function computeAccuracyByCategory(stats: LifetimeStats): CategoryAccuracy[] {
  const rows: CategoryAccuracy[] = [];
  for (const key of Object.keys(stats.byCategory) as Category[]) {
    const tally = stats.byCategory[key];
    if (!tally || tally.total <= 0) continue;
    rows.push({
      category: key,
      total: tally.total,
      correct: tally.correct,
      accuracy: accuracyOf(tally.correct, tally.total),
    });
  }
  rows.sort((a, b) => b.total - a.total || b.accuracy - a.accuracy);
  return rows;
}

// ---- internal helpers ----

function accuracyOf(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

function numOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
