import { describe, it, expect } from "vitest";
import { LEVELS, levelForXp, nextLevel, levelProgress } from "./levels";

describe("levelForXp", () => {
  it("новичок при 0 XP", () => {
    expect(levelForXp(0).title).toBe("Новичок");
  });
  it("не повышается до достижения порога", () => {
    expect(levelForXp(499).index).toBe(0);
    expect(levelForXp(500).index).toBe(1);
  });
  it("ровно на пороге даёт уровень", () => {
    for (const lvl of LEVELS) {
      expect(levelForXp(lvl.minXp).index).toBe(lvl.index);
    }
  });
  it("огромный XP даёт максимальный уровень", () => {
    const top = LEVELS[LEVELS.length - 1];
    expect(levelForXp(1_000_000).index).toBe(top.index);
  });
});

describe("nextLevel", () => {
  it("есть следующий на старте", () => {
    expect(nextLevel(0)?.index).toBe(1);
  });
  it("null на максимальном уровне", () => {
    expect(nextLevel(1_000_000)).toBeNull();
  });
});

describe("levelProgress", () => {
  it("0 в начале уровня", () => {
    expect(levelProgress(0)).toBe(0);
  });
  it("~0.5 на полпути между уровнями", () => {
    // между 0 и 500 -> 250 = 0.5
    expect(levelProgress(250)).toBeCloseTo(0.5, 5);
  });
  it("1 на максимуме", () => {
    expect(levelProgress(1_000_000)).toBe(1);
  });
  it("в пределах [0,1]", () => {
    for (let xp = 0; xp <= 20000; xp += 137) {
      const p = levelProgress(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
  it("пороги уровней строго возрастают", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp);
    }
  });
});
