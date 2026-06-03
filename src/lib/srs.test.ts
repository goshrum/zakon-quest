import { describe, it, expect } from "vitest";
import {
  newCard,
  reviewCard,
  tickQueue,
  pickNext,
  masteredCount,
  mistakeIds,
  MASTERY_STREAK,
  type CardState,
} from "./srs";

describe("reviewCard", () => {
  it("a correct answer grows the streak and the interval", () => {
    const c = reviewCard(newCard("a"), true);
    expect(c.streak).toBe(1);
    expect(c.mastered).toBe(false);
    expect(c.dueIn).toBe(2);
  });
  it("becomes mastered after MASTERY_STREAK correct answers", () => {
    let c = newCard("a");
    for (let i = 0; i < MASTERY_STREAK; i++) c = reviewCard(c, true);
    expect(c.mastered).toBe(true);
    expect(c.streak).toBe(MASTERY_STREAK);
  });
  it("a mistake resets the streak and mastery and brings it back soon", () => {
    let c = newCard("a");
    c = reviewCard(c, true);
    c = reviewCard(c, true);
    c = reviewCard(c, true);
    expect(c.mastered).toBe(true);
    c = reviewCard(c, false);
    expect(c.streak).toBe(0);
    expect(c.mastered).toBe(false);
    expect(c.dueIn).toBe(1);
  });
});

describe("tickQueue", () => {
  it("decreases dueIn without going below 0", () => {
    const cards: CardState[] = [
      { id: "a", streak: 1, mastered: false, dueIn: 2 },
      { id: "b", streak: 0, mastered: false, dueIn: 0 },
    ];
    const next = tickQueue(cards);
    expect(next[0].dueIn).toBe(1);
    expect(next[1].dueIn).toBe(0);
  });
});

describe("pickNext", () => {
  it("prioritises an overdue mistake", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 0, mastered: false, dueIn: 0 }, // answered, got it wrong, ripe
      b: { id: "b", streak: 5, mastered: true, dueIn: 0 },
    };
    expect(pickNext(["a", "b"], cards)).toBe("a");
  });
  it("takes a new question when there are no overdue mistakes", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 5, mastered: true, dueIn: 3 },
    };
    expect(pickNext(["a", "newOne"], cards)).toBe("newOne");
  });
  it("excludes the just-shown question", () => {
    const cards: Record<string, CardState> = {};
    const picked = pickNext(["a", "b"], cards, "a");
    expect(picked).toBe("b");
  });
  it("returns the excluded one when there are no others", () => {
    expect(pickNext(["a"], {}, "a")).toBe("a");
  });
  it("null for an empty list", () => {
    expect(pickNext([], {})).toBeNull();
  });
  it("a mastered, non-mistaken question with dueIn>0 is not returned as due", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 3, mastered: true, dueIn: 0 },
      b: { id: "b", streak: 0, mastered: false, dueIn: 0 }, // mistake, ripe
    };
    expect(pickNext(["a", "b"], cards)).toBe("b");
  });
});

describe("masteredCount", () => {
  it("counts mastered cards", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 3, mastered: true, dueIn: 8 },
      b: { id: "b", streak: 1, mastered: false, dueIn: 2 },
      c: { id: "c", streak: 4, mastered: true, dueIn: 16 },
    };
    expect(masteredCount(cards)).toBe(2);
  });
});

describe("mistakeIds", () => {
  const cards: Record<string, CardState> = {
    a: { id: "a", streak: 0, mastered: false, dueIn: 1 }, // mistake
    b: { id: "b", streak: 3, mastered: true, dueIn: 8 }, // mastered, not a mistake
    c: { id: "c", streak: 1, mastered: false, dueIn: 2 }, // answered, not yet mastered
    gone: { id: "gone", streak: 0, mastered: false, dueIn: 1 }, // stale, removed question
  };

  it("returns answered-but-not-mastered known questions", () => {
    const ids = mistakeIds(cards, ["a", "b", "c"]);
    expect(ids.sort()).toEqual(["a", "c"]);
  });
  it("ignores cards for questions no longer in the set", () => {
    const ids = mistakeIds(cards, ["a", "b", "c"]);
    expect(ids).not.toContain("gone");
  });
  it("returns an empty array when everything is mastered", () => {
    const allMastered: Record<string, CardState> = {
      a: { id: "a", streak: 3, mastered: true, dueIn: 8 },
    };
    expect(mistakeIds(allMastered, ["a"])).toEqual([]);
  });
});
