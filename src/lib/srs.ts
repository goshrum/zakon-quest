// Простая система интервального повторения (spaced repetition).
// Чистые функции: на вход — состояние карточки и результат, на выход — новое состояние.

export interface CardState {
  id: string;
  /** Сколько раз подряд отвечено правильно. */
  streak: number;
  /** Считается ли вопрос "освоенным". */
  mastered: boolean;
  /**
   * Через сколько ВОПРОСОВ карточку снова показать (счётчик очереди).
   * 0 — можно показывать сейчас.
   */
  dueIn: number;
}

/** Порог серии правильных ответов, после которого вопрос считается освоенным. */
export const MASTERY_STREAK = 3;

/** Создаёт пустое состояние карточки. */
export function newCard(id: string): CardState {
  return { id, streak: 0, mastered: false, dueIn: 0 };
}

/**
 * Обновляет карточку после ответа.
 * Правильный ответ увеличивает серию и отодвигает повтор всё дальше.
 * Неправильный — сбрасывает серию, снимает "освоенность" и возвращает карточку скоро.
 */
export function reviewCard(card: CardState, correct: boolean): CardState {
  if (correct) {
    const streak = card.streak + 1;
    const mastered = streak >= MASTERY_STREAK;
    // Интервал растёт: 2, 4, 8, ... вопросов.
    const dueIn = Math.pow(2, Math.min(streak, 5));
    return { ...card, streak, mastered, dueIn };
  }
  // Ошибка: карточка вернётся уже через 1 вопрос, серия и освоенность сброшены.
  return { ...card, streak: 0, mastered: false, dueIn: 1 };
}

/** Уменьшает счётчики dueIn на 1 шаг (вызывается после каждого показанного вопроса). */
export function tickQueue(cards: CardState[]): CardState[] {
  return cards.map((c) => ({ ...c, dueIn: Math.max(0, c.dueIn - 1) }));
}

/**
 * Выбирает следующий вопрос для показа из доступных id.
 * Приоритет: 1) просроченные ошибки (dueIn==0 и не освоено), 2) новые вопросы,
 * 3) освоенные, наиболее «созревшие». Возвращает id или null.
 */
export function pickNext(
  availableIds: string[],
  cards: Record<string, CardState>,
  excludeId?: string,
): string | null {
  const pool = availableIds.filter((id) => id !== excludeId);
  if (pool.length === 0) {
    // Если остался только исключённый — всё равно вернём его.
    return availableIds[0] ?? null;
  }

  // Просроченные карточки, которые уже отвечали (streak записан), но ещё не освоены.
  const due = pool.filter((id) => {
    const c = cards[id];
    return c !== undefined && !c.mastered && c.dueIn <= 0;
  });
  if (due.length > 0) return due[0];

  const fresh = pool.filter((id) => !cards[id]);
  if (fresh.length > 0) return fresh[0];

  // Иначе — карточка с наименьшим dueIn (самая «созревшая»).
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

/** Сколько вопросов освоено. */
export function masteredCount(cards: Record<string, CardState>): number {
  return Object.values(cards).filter((c) => c.mastered).length;
}
