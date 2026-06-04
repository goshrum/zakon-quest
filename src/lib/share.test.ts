import { describe, it, expect } from "vitest";
import { buildShareText } from "./share";

describe("buildShareText", () => {
  it("contains score, accuracy and rank", () => {
    const text = buildShareText({ total: 10, correct: 8, bestStreak: 4, score: 1234 }, "Attorney");
    expect(text).toContain("1234");
    expect(text).toContain("8/10");
    expect(text).toContain("80%");
    expect(text).toContain("Attorney");
    expect(text).toContain("Know the Law");
  });
  it("adds the fire emoji for a streak >= 5", () => {
    const text = buildShareText({ total: 10, correct: 10, bestStreak: 6, score: 999 }, "Judge");
    expect(text).toContain("🔥");
  });
  it("no fire emoji for a short streak", () => {
    const text = buildShareText({ total: 10, correct: 5, bestStreak: 2, score: 500 }, "Newcomer");
    expect(text).not.toContain("🔥");
  });
});
