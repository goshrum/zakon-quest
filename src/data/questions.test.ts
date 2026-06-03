import { describe, it, expect } from "vitest";
import { QUESTIONS } from "./questions";
import { CATEGORIES, QUESTION_TYPES, type Category, type QuestionType } from "./types";

const VALID_CATEGORIES = new Set(Object.keys(CATEGORIES) as Category[]);
const VALID_TYPES = new Set(Object.keys(QUESTION_TYPES) as QuestionType[]);

describe("question data integrity", () => {
  it("has at least 60 questions", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(60);
  });

  it("all ids are unique", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every question is structurally valid", () => {
    for (const q of QUESTIONS) {
      const where = `question "${q.id}"`;

      // id
      expect(typeof q.id, where).toBe("string");
      expect(q.id.trim().length, where).toBeGreaterThan(0);

      // category / type
      expect(VALID_CATEGORIES.has(q.category), `${where}: category`).toBe(true);
      expect(VALID_TYPES.has(q.type), `${where}: type`).toBe(true);

      // prompt
      expect(q.prompt.trim().length, `${where}: prompt`).toBeGreaterThan(0);

      // options
      expect(Array.isArray(q.options), `${where}: options array`).toBe(true);
      expect(q.options.length, `${where}: at least 2 options`).toBeGreaterThanOrEqual(2);
      for (const opt of q.options) {
        expect(opt.trim().length, `${where}: empty option`).toBeGreaterThan(0);
      }
      // options are unique
      expect(new Set(q.options).size, `${where}: duplicate options`).toBe(q.options.length);

      // correctIndex within range
      expect(Number.isInteger(q.correctIndex), `${where}: correctIndex is an integer`).toBe(true);
      expect(q.correctIndex, `${where}: correctIndex >= 0`).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, `${where}: correctIndex < options.length`).toBeLessThan(q.options.length);

      // explanation and citation are not empty
      expect(q.explanation.trim().length, `${where}: explanation`).toBeGreaterThan(0);
      expect(q.citation.trim().length, `${where}: citation`).toBeGreaterThan(0);

      // difficulty
      expect([1, 2, 3].includes(q.difficulty), `${where}: difficulty`).toBe(true);
    }
  });

  it("contains no Cyrillic characters in any field", () => {
    // Cyrillic block U+0400-U+04FF, built from a string of escapes so this file
    // itself stays free of literal Cyrillic characters.
    const cyrillic = new RegExp("[\\u0400-\\u04FF]");
    for (const q of QUESTIONS) {
      const where = `question "${q.id}"`;
      const fields = [q.id, q.prompt, q.explanation, q.citation, ...q.options];
      for (const f of fields) {
        expect(cyrillic.test(f), `${where}: Cyrillic found in "${f}"`).toBe(false);
      }
    }
  });

  it("myth questions have exactly 2 options (True/False)", () => {
    for (const q of QUESTIONS.filter((x) => x.type === "myth")) {
      expect(q.options, `question "${q.id}"`).toEqual(["True", "False"]);
    }
  });

  it("every category contains at least one question", () => {
    for (const cat of VALID_CATEGORIES) {
      const count = QUESTIONS.filter((q) => q.category === cat).length;
      expect(count, `category ${cat} is empty`).toBeGreaterThan(0);
    }
  });

  it("all question types are represented", () => {
    for (const t of VALID_TYPES) {
      const count = QUESTIONS.filter((q) => q.type === t).length;
      expect(count, `type ${t} is missing`).toBeGreaterThan(0);
    }
  });
});
