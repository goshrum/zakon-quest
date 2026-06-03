import { describe, it, expect } from "vitest";
import {
  BASE_POINTS,
  comboMultiplier,
  timeBonus,
  scoreAnswer,
  accuracyPercent,
} from "./scoring";

describe("comboMultiplier", () => {
  it("1x для серии 0 или 1", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBe(1);
  });
  it("растёт на 0.5 за каждый шаг", () => {
    expect(comboMultiplier(2)).toBe(1.5);
    expect(comboMultiplier(3)).toBe(2);
  });
  it("ограничен сверху 3x", () => {
    expect(comboMultiplier(10)).toBe(3);
    expect(comboMultiplier(100)).toBe(3);
  });
});

describe("timeBonus", () => {
  it("0 если лимит времени не задан", () => {
    expect(timeBonus(1000, 0)).toBe(0);
  });
  it("+50% при мгновенном ответе", () => {
    expect(timeBonus(1000, 1000)).toBe(0.5);
  });
  it("0% при истёкшем времени", () => {
    expect(timeBonus(0, 1000)).toBe(0);
  });
  it("масштабируется линейно", () => {
    expect(timeBonus(500, 1000)).toBe(0.25);
  });
  it("не выходит за границы", () => {
    expect(timeBonus(2000, 1000)).toBe(0.5);
    expect(timeBonus(-100, 1000)).toBe(0);
  });
});

describe("scoreAnswer", () => {
  it("неправильный ответ = 0", () => {
    expect(scoreAnswer({ correct: false, difficulty: 3, streak: 5 })).toBe(0);
  });
  it("базовые очки без комбо и без таймера", () => {
    expect(scoreAnswer({ correct: true, difficulty: 1, streak: 1 })).toBe(BASE_POINTS[1]);
    expect(scoreAnswer({ correct: true, difficulty: 2, streak: 1 })).toBe(150);
    expect(scoreAnswer({ correct: true, difficulty: 3, streak: 1 })).toBe(200);
  });
  it("учитывает множитель комбо", () => {
    // difficulty 1 (100) * combo(streak 3 -> 2x) = 200
    expect(scoreAnswer({ correct: true, difficulty: 1, streak: 3 })).toBe(200);
  });
  it("учитывает бонус за скорость", () => {
    // 100 * 1 (streak 1) * 1.5 (мгновенно) = 150
    expect(
      scoreAnswer({ correct: true, difficulty: 1, streak: 1, remainingMs: 1000, totalMs: 1000 }),
    ).toBe(150);
  });
  it("комбинирует комбо и время", () => {
    // 200 * 2 (streak 3) * 1.5 (мгновенно) = 600
    expect(
      scoreAnswer({ correct: true, difficulty: 3, streak: 3, remainingMs: 500, totalMs: 500 }),
    ).toBe(600);
  });
});

describe("accuracyPercent", () => {
  it("0 при отсутствии ответов", () => {
    expect(accuracyPercent({ total: 0, correct: 0 })).toBe(0);
  });
  it("считает округлённый процент", () => {
    expect(accuracyPercent({ total: 10, correct: 7 })).toBe(70);
    expect(accuracyPercent({ total: 3, correct: 1 })).toBe(33);
    expect(accuracyPercent({ total: 3, correct: 2 })).toBe(67);
  });
});
