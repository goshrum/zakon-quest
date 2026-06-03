// Уровни и звания игрока на основе накопленного XP. Чистые функции.

export interface Level {
  index: number;
  title: string;
  /** Минимальный XP для достижения уровня. */
  minXp: number;
}

// Весёлые юридические звания: рост от новичка до судьи и выше.
export const LEVELS: Level[] = [
  { index: 0, title: "Новичок", minXp: 0 },
  { index: 1, title: "Студент-юрист", minXp: 500 },
  { index: 2, title: "Юрисконсульт", minXp: 1500 },
  { index: 3, title: "Адвокат", minXp: 3500 },
  { index: 4, title: "Прокурор", minXp: 6500 },
  { index: 5, title: "Судья", minXp: 11000 },
  { index: 6, title: "Судья Верховного суда", minXp: 18000 },
];

/** Возвращает текущий уровень по XP. */
export function levelForXp(xp: number): Level {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  return current;
}

/** Следующий уровень или null, если достигнут максимум. */
export function nextLevel(xp: number): Level | null {
  const current = levelForXp(xp);
  return LEVELS[current.index + 1] ?? null;
}

/**
 * Прогресс до следующего уровня от 0 до 1.
 * На максимальном уровне всегда 1.
 */
export function levelProgress(xp: number): number {
  const current = levelForXp(xp);
  const next = nextLevel(xp);
  if (!next) return 1;
  const span = next.minXp - current.minXp;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (xp - current.minXp) / span));
}
