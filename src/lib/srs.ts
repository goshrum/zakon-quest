// A simple spaced-repetition system (SRS).
// Pure functions: given a card state and a result, return a new state.

export interface CardState {
  id: string;
  /** How many times in a row it has been answered correctly. */
  streak: number;
  /** Whether the question is considered "mastered". */
  mastered: boolean;
  /**
   * In how many QUESTIONS the card should be shown again (queue counter).
   * 0 — it can be shown now.
   */
  dueIn: number;
}

/** Streak threshold of correct answers after which a question is considered mastered. */
export const MASTERY_STREAK = 3;

/** Creates an empty card state. */
export function newCard(id: string): CardState {
  return { id, streak: 0, mastered: false, dueIn: 0 };
}

/**
 * Updates a card after an answer.
 * A correct answer grows the streak and pushes the repeat further out.
 * A wrong one resets the streak, clears "mastered" and brings the card back soon.
 */
export function reviewCard(card: CardState, correct: boolean): CardState {
  if (correct) {
    const streak = card.streak + 1;
    const mastered = streak >= MASTERY_STREAK;
    // The interval grows: 2, 4, 8, ... questions.
    const dueIn = Math.pow(2, Math.min(streak, 5));
    return { ...card, streak, mastered, dueIn };
  }
  // Mistake: the card returns in just 1 question, streak and mastery reset.
  return { ...card, streak: 0, mastered: false, dueIn: 1 };
}

/** Decreases dueIn counters by 1 step (called after each shown question). */
export function tickQueue(cards: CardState[]): CardState[] {
  return cards.map((c) => ({ ...c, dueIn: Math.max(0, c.dueIn - 1) }));
}

/**
 * Picks the next question to show from the available ids.
 * Priority: 1) overdue mistakes (dueIn==0 and not mastered), 2) new questions,
 * 3) mastered ones that are most "ripe". Returns an id or null.
 */
export function pickNext(
  availableIds: string[],
  cards: Record<string, CardState>,
  excludeId?: string,
): string | null {
  const pool = availableIds.filter((id) => id !== excludeId);
  if (pool.length === 0) {
    // If only the excluded one is left — return it anyway.
    return availableIds[0] ?? null;
  }

  // Overdue cards that have been answered already (streak recorded) but not yet mastered.
  const due = pool.filter((id) => {
    const c = cards[id];
    return c !== undefined && !c.mastered && c.dueIn <= 0;
  });
  if (due.length > 0) return due[0];

  const fresh = pool.filter((id) => !cards[id]);
  if (fresh.length > 0) return fresh[0];

  // Otherwise — the card with the smallest dueIn (the most "ripe").
  let best: string | null = null;
  let bestDue = Infinity;
  for (const id of pool) {
    const d = cards[id]?.dueIn ?? 0;
    if (d < bestDue) {
      bestDue = d;
      best = id;
    }
  }
  return best;
}

/** How many questions are mastered. */
export function masteredCount(cards: Record<string, CardState>): number {
  return Object.values(cards).filter((c) => c.mastered).length;
}

/**
 * Ids of questions that have been answered but are not yet mastered — i.e. the
 * player has gotten them wrong (or not yet answered them correctly enough times).
 * Restricted to `knownIds` so stale cards for removed questions are ignored.
 * Used by the "review your mistakes" mode.
 */
export function mistakeIds(cards: Record<string, CardState>, knownIds: Iterable<string>): string[] {
  const known = new Set(knownIds);
  return Object.values(cards)
    .filter((c) => !c.mastered && known.has(c.id))
    .map((c) => c.id);
}
