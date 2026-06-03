// Pure functions for scoring, combos and bonuses. No side effects.

import type { Difficulty } from "../data/types";

/** Base points for a correct answer, depending on difficulty. */
export const BASE_POINTS: Record<Difficulty, number> = {
  1: 100,
  2: 150,
  3: 200,
};

/**
 * Combo multiplier: the longer the streak of correct answers, the higher it is.
 * 0 correct in a row -> 1x; grows by 0.5 per step, capped at 3x.
 */
export function comboMultiplier(streak: number): number {
  if (streak <= 1) return 1;
  return Math.min(3, 1 + (streak - 1) * 0.5);
}

/**
 * Speed bonus: a fraction from 0 to 1 relative to the time limit.
 * The faster the answer, the larger the bonus (up to +50% of base points).
 * remainingMs/totalMs == 1 (answered instantly) -> +50%; == 0 -> +0%.
 */
export function timeBonus(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
  return ratio * 0.5;
}

export interface ScoreInput {
  correct: boolean;
  difficulty: Difficulty;
  /** Streak length AFTER this answer (1 for the first correct one). */
  streak: number;
  /** Remaining time in ms (0 if the timer is not used). */
  remainingMs?: number;
  /** Full time limit in ms (0 if the timer is not used). */
  totalMs?: number;
}

/** Computes points for a single answer. A wrong answer is always 0. */
export function scoreAnswer(input: ScoreInput): number {
  if (!input.correct) return 0;
  const base = BASE_POINTS[input.difficulty];
  const combo = comboMultiplier(input.streak);
  const bonus = 1 + timeBonus(input.remainingMs ?? 0, input.totalMs ?? 0);
  return Math.round(base * combo * bonus);
}

export interface RoundStats {
  total: number;
  correct: number;
  bestStreak: number;
  score: number;
}

/** Accuracy as a percentage (integer 0..100). */
export function accuracyPercent(stats: Pick<RoundStats, "total" | "correct">): number {
  if (stats.total <= 0) return 0;
  return Math.round((stats.correct / stats.total) * 100);
}
