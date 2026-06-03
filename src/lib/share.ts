// Builds the "share your result" text. Pure function, no network.

import { accuracyPercent, type RoundStats } from "./scoring";

export function buildShareText(stats: RoundStats, levelTitle: string): string {
  const acc = accuracyPercent(stats);
  const fire = stats.bestStreak >= 5 ? " 🔥" : "";
  return [
    "📜 Know the Law",
    `Score: ${stats.score}`,
    `Correct: ${stats.correct}/${stats.total} (${acc}%)`,
    `Best streak: ${stats.bestStreak}${fire}`,
    `Rank: ${levelTitle}`,
    "",
    "Test your knowledge of the law!",
  ].join("\n");
}
