import { describe, it, expect } from "vitest";
import {
  newCard,
  reviewCard,
  tickQueue,
  pickNext,
  masteredCount,
  MASTERY_STREAK,
  type CardState,
} from "./srs";

describe("reviewCard", () => {
  it("правильный ответ увеличивает серию и интервал", () => {
    const c = reviewCard(newCard("a"), true);
    expect(c.streak).toBe(1);
    expect(c.mastered).toBe(false);
    expect(c.dueIn).toBe(2);
  });
  it("осваивается после MASTERY_STREAK правильных", () => {
    let c = newCard("a");
    for (let i = 0; i < MASTERY_STREAK; i++) c = reviewCard(c, true);
    expect(c.mastered).toBe(true);
    expect(c.streak).toBe(MASTERY_STREAK);
  });
  it("ошибка сбрасывает серию и освоенность и возвращает скоро", () => {
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
  it("уменьшает dueIn, не уходя ниже 0", () => {
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
  it("приоритет у просроченной ошибки", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 0, mastered: false, dueIn: 0 }, // отвечали, ошиблись, созрела
      b: { id: "b", streak: 5, mastered: true, dueIn: 0 },
    };
    expect(pickNext(["a", "b"], cards)).toBe("a");
  });
  it("берёт новый вопрос, если нет просроченных ошибок", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 5, mastered: true, dueIn: 3 },
    };
    expect(pickNext(["a", "newOne"], cards)).toBe("newOne");
  });
  it("исключает только что показанный вопрос", () => {
    const cards: Record<string, CardState> = {};
    const picked = pickNext(["a", "b"], cards, "a");
    expect(picked).toBe("b");
  });
  it("возвращает исключённый, если других нет", () => {
    expect(pickNext(["a"], {}, "a")).toBe("a");
  });
  it("null при пустом списке", () => {
    expect(pickNext([], {})).toBeNull();
  });
  it("освоенный неошибочный вопрос с dueIn>0 не выдаётся как due", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 3, mastered: true, dueIn: 0 },
      b: { id: "b", streak: 0, mastered: false, dueIn: 0 }, // ошибка, созрела
    };
    expect(pickNext(["a", "b"], cards)).toBe("b");
  });
});

describe("masteredCount", () => {
  it("считает освоенные карточки", () => {
    const cards: Record<string, CardState> = {
      a: { id: "a", streak: 3, mastered: true, dueIn: 8 },
      b: { id: "b", streak: 1, mastered: false, dueIn: 2 },
      c: { id: "c", streak: 4, mastered: true, dueIn: 16 },
    };
    expect(masteredCount(cards)).toBe(2);
  });
});
