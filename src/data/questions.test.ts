import { describe, it, expect } from "vitest";
import { QUESTIONS } from "./questions";
import { CATEGORIES, QUESTION_TYPES, type Category, type QuestionType } from "./types";

const VALID_CATEGORIES = new Set(Object.keys(CATEGORIES) as Category[]);
const VALID_TYPES = new Set(Object.keys(QUESTION_TYPES) as QuestionType[]);

describe("целостность данных вопросов", () => {
  it("есть хотя бы 60 вопросов", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(60);
  });

  it("все id уникальны", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("каждый вопрос структурно валиден", () => {
    for (const q of QUESTIONS) {
      const where = `вопрос "${q.id}"`;

      // id
      expect(typeof q.id, where).toBe("string");
      expect(q.id.trim().length, where).toBeGreaterThan(0);

      // category / type
      expect(VALID_CATEGORIES.has(q.category), `${where}: категория`).toBe(true);
      expect(VALID_TYPES.has(q.type), `${where}: тип`).toBe(true);

      // prompt
      expect(q.prompt.trim().length, `${where}: prompt`).toBeGreaterThan(0);

      // options
      expect(Array.isArray(q.options), `${where}: options массив`).toBe(true);
      expect(q.options.length, `${where}: минимум 2 варианта`).toBeGreaterThanOrEqual(2);
      for (const opt of q.options) {
        expect(opt.trim().length, `${where}: пустой вариант`).toBeGreaterThan(0);
      }
      // варианты уникальны
      expect(new Set(q.options).size, `${where}: дубликаты вариантов`).toBe(q.options.length);

      // correctIndex в диапазоне
      expect(Number.isInteger(q.correctIndex), `${where}: correctIndex целое`).toBe(true);
      expect(q.correctIndex, `${where}: correctIndex >= 0`).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, `${where}: correctIndex < options.length`).toBeLessThan(q.options.length);

      // explanation и citation не пустые
      expect(q.explanation.trim().length, `${where}: explanation`).toBeGreaterThan(0);
      expect(q.citation.trim().length, `${where}: citation`).toBeGreaterThan(0);

      // difficulty
      expect([1, 2, 3].includes(q.difficulty), `${where}: difficulty`).toBe(true);
    }
  });

  it("вопросы типа myth имеют ровно 2 варианта (Верю/Не верю)", () => {
    for (const q of QUESTIONS.filter((x) => x.type === "myth")) {
      expect(q.options, `вопрос "${q.id}"`).toEqual(["Верю", "Не верю"]);
    }
  });

  it("каждая категория содержит хотя бы один вопрос", () => {
    for (const cat of VALID_CATEGORIES) {
      const count = QUESTIONS.filter((q) => q.category === cat).length;
      expect(count, `категория ${cat} пуста`).toBeGreaterThan(0);
    }
  });

  it("представлены все типы вопросов", () => {
    for (const t of VALID_TYPES) {
      const count = QUESTIONS.filter((q) => q.type === t).length;
      expect(count, `тип ${t} отсутствует`).toBeGreaterThan(0);
    }
  });
});
