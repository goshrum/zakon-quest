// Чистые функции для подсчёта очков, комбо и бонусов. Без побочных эффектов.

import type { Difficulty } from "../data/types";

/** Базовые очки за правильный ответ в зависимости от сложности. */
export const BASE_POINTS: Record<Difficulty, number> = {
  1: 100,
  2: 150,
  3: 200,
};

/**
 * Множитель комбо: чем длиннее серия правильных ответов, тем выше.
 * 0 правильных подряд -> 1x; растёт на 0.5 за каждый, максимум 3x.
 */
export function comboMultiplier(streak: number): number {
  if (streak <= 1) return 1;
  return Math.min(3, 1 + (streak - 1) * 0.5);
}

/**
 * Бонус за скорость: доля от 0 до 1 относительно лимита времени.
 * Чем быстрее ответ, тем больше бонус (до +50% базовых очков).
 * remainingMs/totalMs == 1 (ответил мгновенно) -> +50%; == 0 -> +0%.
 */
export function timeBonus(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
  return ratio * 0.5;
}

export interface ScoreInput {
  correct: boolean;
  difficulty: Difficulty;
  /** Длина серии ПОСЛЕ этого ответа (1 за первый правильный). */
  streak: number;
  /** Оставшееся время в мс (0, если таймер не используется). */
  remainingMs?: number;
  /** Полный лимит времени в мс (0, если таймер не используется). */
  totalMs?: number;
}

/** Считает очки за один ответ. Неправильный ответ — всегда 0. */
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

/** Точность в процентах (целое число 0..100). */
export function accuracyPercent(stats: Pick<RoundStats, "total" | "correct">): number {
  if (stats.total <= 0) return 0;
  return Math.round((stats.correct / stats.total) * 100);
}
