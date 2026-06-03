import { describe, it, expect } from "vitest";
import { buildShareText } from "./share";

describe("buildShareText", () => {
  it("содержит счёт, точность и звание", () => {
    const text = buildShareText(
      { total: 10, correct: 8, bestStreak: 4, score: 1234 },
      "Адвокат",
    );
    expect(text).toContain("1234");
    expect(text).toContain("8/10");
    expect(text).toContain("80%");
    expect(text).toContain("Адвокат");
    expect(text).toContain("Познаём закон");
  });
  it("добавляет огонёк при серии >= 5", () => {
    const text = buildShareText({ total: 10, correct: 10, bestStreak: 6, score: 999 }, "Судья");
    expect(text).toContain("🔥");
  });
  it("без огонька при короткой серии", () => {
    const text = buildShareText({ total: 10, correct: 5, bestStreak: 2, score: 500 }, "Новичок");
    expect(text).not.toContain("🔥");
  });
});
