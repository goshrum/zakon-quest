// Deterministic answer checking and question selection. Pure functions.

import type { Category, Question } from "../data/types";

/** Checks whether the selected option is correct. */
export function isCorrect(question: Question, selectedIndex: number): boolean {
  return selectedIndex === question.correctIndex;
}

/** Filters questions by selected categories (empty set = all categories). */
export function filterByCategories(questions: Question[], categories: Set<Category>): Question[] {
  if (categories.size === 0) return [...questions];
  return questions.filter((q) => categories.has(q.category));
}

/**
 * Deterministic seeded shuffle (Mulberry32 + Fisher–Yates).
 * Makes the ordering predictable for tests.
 */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0;
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
