// Формирование текста «поделиться результатом». Чистая функция, без сети.

import { accuracyPercent, type RoundStats } from "./scoring";

export function buildShareText(stats: RoundStats, levelTitle: string): string {
  const acc = accuracyPercent(stats);
  const fire = stats.bestStreak >= 5 ? " 🔥" : "";
  return [
    "📜 Познаём закон",
    `Счёт: ${stats.score}`,
    `Правильно: ${stats.correct}/${stats.total} (${acc}%)`,
    `Лучшая серия: ${stats.bestStreak}${fire}`,
    `Звание: ${levelTitle}`,
    "",
    "Проверь свои знания права!",
  ].join("\n");
}
