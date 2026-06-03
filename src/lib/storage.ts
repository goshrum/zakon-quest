// Тонкая обёртка над localStorage для персистентности прогресса.
// Логика остаётся в чистых функциях; здесь только I/O.

import type { CardState } from "./srs";

const KEY = "zakon-quest:progress:v1";

export interface Progress {
  xp: number;
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  cards: Record<string, CardState>;
}

export function emptyProgress(): Progress {
  return { xp: 0, totalAnswered: 0, totalCorrect: 0, bestStreak: 0, cards: {} };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...emptyProgress(), ...parsed, cards: parsed.cards ?? {} };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // localStorage может быть недоступен (приватный режим) — молча игнорируем.
  }
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // игнорируем
  }
}
