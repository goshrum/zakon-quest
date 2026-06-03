import { describe, it, expect } from "vitest";
import { LEVELS, levelForXp, nextLevel, levelProgress } from "./levels";

describe("levelForXp", () => {
  it("newcomer at 0 XP", () => {
    expect(levelForXp(0).title).toBe("Newcomer");
  });
  it("does not level up before reaching the threshold", () => {
    expect(levelForXp(499).index).toBe(0);
    expect(levelForXp(500).index).toBe(1);
  });
  it("exactly at the threshold gives the level", () => {
    for (const lvl of LEVELS) {
      expect(levelForXp(lvl.minXp).index).toBe(lvl.index);
    }
  });
  it("huge XP gives the maximum level", () => {
    const top = LEVELS[LEVELS.length - 1];
    expect(levelForXp(1_000_000).index).toBe(top.index);
  });
});

describe("nextLevel", () => {
  it("there is a next level at the start", () => {
    expect(nextLevel(0)?.index).toBe(1);
  });
  it("null at the maximum level", () => {
    expect(nextLevel(1_000_000)).toBeNull();
  });
});

describe("levelProgress", () => {
  it("0 at the start of a level", () => {
    expect(levelProgress(0)).toBe(0);
  });
  it("~0.5 halfway between levels", () => {
    // between 0 and 500 -> 250 = 0.5
    expect(levelProgress(250)).toBeCloseTo(0.5, 5);
  });
  it("1 at the maximum", () => {
    expect(levelProgress(1_000_000)).toBe(1);
  });
  it("within [0,1]", () => {
    for (let xp = 0; xp <= 20000; xp += 137) {
      const p = levelProgress(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
  it("level thresholds are strictly increasing", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp);
    }
  });
});
