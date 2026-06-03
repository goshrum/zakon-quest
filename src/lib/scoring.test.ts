import { describe, it, expect } from "vitest";
import {
  BASE_POINTS,
  comboMultiplier,
  timeBonus,
  scoreAnswer,
  accuracyPercent,
} from "./scoring";

describe("comboMultiplier", () => {
  it("1x for a streak of 0 or 1", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBe(1);
  });
  it("grows by 0.5 per step", () => {
    expect(comboMultiplier(2)).toBe(1.5);
    expect(comboMultiplier(3)).toBe(2);
  });
  it("is capped at 3x", () => {
    expect(comboMultiplier(10)).toBe(3);
    expect(comboMultiplier(100)).toBe(3);
  });
});

describe("timeBonus", () => {
  it("0 when no time limit is set", () => {
    expect(timeBonus(1000, 0)).toBe(0);
  });
  it("+50% for an instant answer", () => {
    expect(timeBonus(1000, 1000)).toBe(0.5);
  });
  it("0% when time has run out", () => {
    expect(timeBonus(0, 1000)).toBe(0);
  });
  it("scales linearly", () => {
    expect(timeBonus(500, 1000)).toBe(0.25);
  });
  it("stays within bounds", () => {
    expect(timeBonus(2000, 1000)).toBe(0.5);
    expect(timeBonus(-100, 1000)).toBe(0);
  });
});

describe("scoreAnswer", () => {
  it("wrong answer = 0", () => {
    expect(scoreAnswer({ correct: false, difficulty: 3, streak: 5 })).toBe(0);
  });
  it("base points without combo and without timer", () => {
    expect(scoreAnswer({ correct: true, difficulty: 1, streak: 1 })).toBe(BASE_POINTS[1]);
    expect(scoreAnswer({ correct: true, difficulty: 2, streak: 1 })).toBe(150);
    expect(scoreAnswer({ correct: true, difficulty: 3, streak: 1 })).toBe(200);
  });
  it("applies the combo multiplier", () => {
    // difficulty 1 (100) * combo(streak 3 -> 2x) = 200
    expect(scoreAnswer({ correct: true, difficulty: 1, streak: 3 })).toBe(200);
  });
  it("applies the speed bonus", () => {
    // 100 * 1 (streak 1) * 1.5 (instant) = 150
    expect(
      scoreAnswer({ correct: true, difficulty: 1, streak: 1, remainingMs: 1000, totalMs: 1000 }),
    ).toBe(150);
  });
  it("combines combo and time", () => {
    // 200 * 2 (streak 3) * 1.5 (instant) = 600
    expect(
      scoreAnswer({ correct: true, difficulty: 3, streak: 3, remainingMs: 500, totalMs: 500 }),
    ).toBe(600);
  });
});

describe("accuracyPercent", () => {
  it("0 when there are no answers", () => {
    expect(accuracyPercent({ total: 0, correct: 0 })).toBe(0);
  });
  it("computes the rounded percentage", () => {
    expect(accuracyPercent({ total: 10, correct: 7 })).toBe(70);
    expect(accuracyPercent({ total: 3, correct: 1 })).toBe(33);
    expect(accuracyPercent({ total: 3, correct: 2 })).toBe(67);
  });
});
