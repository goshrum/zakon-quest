import { describe, it, expect } from "vitest";
import { isCorrect, filterByCategories, seededShuffle } from "./answer";
import type { Category, Question } from "../data/types";

const q: Question = {
  id: "t1",
  category: "civil",
  type: "code",
  prompt: "?",
  options: ["A", "B", "C"],
  correctIndex: 1,
  explanation: "e",
  citation: "c",
  difficulty: 1,
};

describe("isCorrect", () => {
  it("true для правильного индекса", () => {
    expect(isCorrect(q, 1)).toBe(true);
  });
  it("false для неправильного", () => {
    expect(isCorrect(q, 0)).toBe(false);
    expect(isCorrect(q, 2)).toBe(false);
  });
});

describe("filterByCategories", () => {
  const qs: Question[] = [
    { ...q, id: "a", category: "civil" },
    { ...q, id: "b", category: "criminal" },
    { ...q, id: "c", category: "labor" },
  ];
  it("пустой набор = все", () => {
    expect(filterByCategories(qs, new Set<Category>())).toHaveLength(3);
  });
  it("фильтрует по выбранным", () => {
    const res = filterByCategories(qs, new Set<Category>(["criminal", "labor"]));
    expect(res.map((x) => x.id).sort()).toEqual(["b", "c"]);
  });
});

describe("seededShuffle", () => {
  it("детерминирован при одном seed", () => {
    const a = seededShuffle([1, 2, 3, 4, 5], 42);
    const b = seededShuffle([1, 2, 3, 4, 5], 42);
    expect(a).toEqual(b);
  });
  it("сохраняет все элементы", () => {
    const res = seededShuffle([1, 2, 3, 4, 5], 7);
    expect([...res].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5]);
  });
  it("не мутирует вход", () => {
    const input = [1, 2, 3];
    seededShuffle(input, 1);
    expect(input).toEqual([1, 2, 3]);
  });
  it("разные seed обычно дают разный порядок", () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 1);
    const b = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 2);
    expect(a).not.toEqual(b);
  });
});
