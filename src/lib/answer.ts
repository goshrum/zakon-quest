// Детерминированная проверка ответов и отбор вопросов. Чистые функции.

import type { Category, Question } from "../data/types";

/** Проверяет, верен ли выбранный вариант. */
export function isCorrect(question: Question, selectedIndex: number): boolean {
  return selectedIndex === question.correctIndex;
}

/** Фильтрует вопросы по выбранным категориям (пустой набор = все категории). */
export function filterByCategories(questions: Question[], categories: Set<Category>): Question[] {
  if (categories.size === 0) return [...questions];
  return questions.filter((q) => categories.has(q.category));
}

/**
 * Детерминированный shuffle на основе seed (Mulberry32 + Fisher–Yates).
 * Позволяет тестировать порядок предсказуемо.
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
