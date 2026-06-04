import { describe, it, expect } from "vitest";
import {
  emptyStats,
  migrateStats,
  updateStats,
  overallAccuracy,
  computeAccuracyByCategory,
  type LifetimeStats,
} from "./stats";

describe("emptyStats", () => {
  it("is fully zeroed", () => {
    expect(emptyStats()).toEqual({
      totalAnswered: 0,
      totalCorrect: 0,
      bestStreak: 0,
      byCategory: {},
    });
  });
});

describe("migrateStats", () => {
  it("returns defaults for null/undefined", () => {
    expect(migrateStats(null)).toEqual(emptyStats());
    expect(migrateStats(undefined)).toEqual(emptyStats());
  });

  it("fills in missing fields from a partial object", () => {
    const migrated = migrateStats({ totalAnswered: 5 });
    expect(migrated.totalAnswered).toBe(5);
    expect(migrated.totalCorrect).toBe(0);
    expect(migrated.bestStreak).toBe(0);
    expect(migrated.byCategory).toEqual({});
  });

  it("preserves a valid per-category breakdown", () => {
    const migrated = migrateStats({ byCategory: { civil: { total: 4, correct: 3 } } });
    expect(migrated.byCategory.civil).toEqual({ total: 4, correct: 3 });
  });

  it("clamps corrupt tallies (negatives and correct > total)", () => {
    const migrated = migrateStats({
      totalAnswered: -10,
      byCategory: { tax: { total: 2, correct: 9 } },
    });
    expect(migrated.totalAnswered).toBe(0);
    expect(migrated.byCategory.tax).toEqual({ total: 2, correct: 2 });
  });

  it("does not mutate the input", () => {
    const input = { totalAnswered: 1 };
    migrateStats(input);
    expect(input).toEqual({ totalAnswered: 1 });
  });
});

describe("updateStats", () => {
  it("records a correct answer", () => {
    const next = updateStats(emptyStats(), { category: "civil", correct: true, streak: 1 });
    expect(next.totalAnswered).toBe(1);
    expect(next.totalCorrect).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.byCategory.civil).toEqual({ total: 1, correct: 1 });
  });

  it("records a wrong answer without crediting correctness", () => {
    const next = updateStats(emptyStats(), { category: "criminal", correct: false, streak: 0 });
    expect(next.totalAnswered).toBe(1);
    expect(next.totalCorrect).toBe(0);
    expect(next.byCategory.criminal).toEqual({ total: 1, correct: 0 });
  });

  it("accumulates across answers and tracks best streak", () => {
    let s = emptyStats();
    s = updateStats(s, { category: "civil", correct: true, streak: 1 });
    s = updateStats(s, { category: "civil", correct: true, streak: 2 });
    s = updateStats(s, { category: "tax", correct: false, streak: 0 });
    s = updateStats(s, { category: "tax", correct: true, streak: 1 });
    expect(s.totalAnswered).toBe(4);
    expect(s.totalCorrect).toBe(3);
    expect(s.bestStreak).toBe(2);
    expect(s.byCategory.civil).toEqual({ total: 2, correct: 2 });
    expect(s.byCategory.tax).toEqual({ total: 2, correct: 1 });
  });

  it("does not lower an existing best streak", () => {
    let s = updateStats(emptyStats(), { category: "civil", correct: true, streak: 7 });
    s = updateStats(s, { category: "civil", correct: false, streak: 0 });
    expect(s.bestStreak).toBe(7);
  });

  it("does not mutate the previous stats object", () => {
    const prev = emptyStats();
    updateStats(prev, { category: "civil", correct: true, streak: 1 });
    expect(prev).toEqual(emptyStats());
  });
});

describe("overallAccuracy", () => {
  it("is 0 with no answers", () => {
    expect(overallAccuracy(emptyStats())).toBe(0);
  });
  it("rounds to an integer percentage", () => {
    const s: LifetimeStats = { totalAnswered: 3, totalCorrect: 2, bestStreak: 1, byCategory: {} };
    expect(overallAccuracy(s)).toBe(67);
  });
});

describe("computeAccuracyByCategory", () => {
  it("is empty for fresh stats", () => {
    expect(computeAccuracyByCategory(emptyStats())).toEqual([]);
  });

  it("skips categories with no answers", () => {
    const s: LifetimeStats = {
      totalAnswered: 0,
      totalCorrect: 0,
      bestStreak: 0,
      byCategory: { civil: { total: 0, correct: 0 } },
    };
    expect(computeAccuracyByCategory(s)).toEqual([]);
  });

  it("computes per-category accuracy sorted by most answered", () => {
    const s: LifetimeStats = {
      totalAnswered: 10,
      totalCorrect: 6,
      bestStreak: 3,
      byCategory: {
        civil: { total: 2, correct: 1 },
        criminal: { total: 8, correct: 5 },
      },
    };
    const rows = computeAccuracyByCategory(s);
    expect(rows).toEqual([
      { category: "criminal", total: 8, correct: 5, accuracy: 63 },
      { category: "civil", total: 2, correct: 1, accuracy: 50 },
    ]);
  });
});
