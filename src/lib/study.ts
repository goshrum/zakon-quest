// Pure filtering for the Study / Browse reference list. No DOM, no side effects.

import type { Category, Question } from "../data/types";

/**
 * Filters questions for the study screen.
 *
 * - `query` is matched case-insensitively as a substring against the prompt,
 *   explanation, citation and category fields. An empty/whitespace-only query
 *   matches everything.
 * - `category`, when provided, restricts results to that single category.
 *
 * The input array is never mutated.
 */
export function filterQuestions(
  questions: Question[],
  query: string,
  category?: Category | null,
): Question[] {
  const needle = query.trim().toLowerCase();
  return questions.filter((q) => {
    if (category && q.category !== category) return false;
    if (needle === "") return true;
    const haystack = `${q.prompt} ${q.explanation} ${q.citation} ${q.category}`.toLowerCase();
    return haystack.includes(needle);
  });
}
