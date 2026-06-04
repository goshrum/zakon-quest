import { describe, it, expect } from "vitest";
import { filterQuestions } from "./study";
import type { Question } from "../data/types";

const base: Question = {
  id: "x",
  category: "civil",
  type: "code",
  prompt: "?",
  options: ["A", "B"],
  correctIndex: 0,
  explanation: "e",
  citation: "c",
  difficulty: 1,
};

const qs: Question[] = [
  {
    ...base,
    id: "a",
    category: "civil",
    prompt: "Limitation period for civil claims",
    explanation: "The general period is three years.",
    citation: "Art. 196, Civil Code of the Russian Federation",
  },
  {
    ...base,
    id: "b",
    category: "criminal",
    prompt: "What is theft?",
    explanation: "Theft is the secret stealing of property.",
    citation: "Art. 158, Criminal Code of the Russian Federation",
  },
  {
    ...base,
    id: "c",
    category: "labor",
    prompt: "Probation period maximum",
    explanation: "Usually up to three months for ordinary employees.",
    citation: "Art. 70, Labour Code of the Russian Federation",
  },
];

describe("filterQuestions", () => {
  it("empty query returns all questions", () => {
    expect(filterQuestions(qs, "")).toHaveLength(3);
    expect(filterQuestions(qs, "   ")).toHaveLength(3);
  });

  it("matches in the prompt", () => {
    const res = filterQuestions(qs, "theft");
    expect(res.map((q) => q.id)).toEqual(["b"]);
  });

  it("matches in the explanation", () => {
    const res = filterQuestions(qs, "secret stealing");
    expect(res.map((q) => q.id)).toEqual(["b"]);
  });

  it("matches in the citation", () => {
    const res = filterQuestions(qs, "art. 70");
    expect(res.map((q) => q.id)).toEqual(["c"]);
  });

  it("matches in the category", () => {
    const res = filterQuestions(qs, "criminal");
    expect(res.map((q) => q.id)).toEqual(["b"]);
  });

  it("is case-insensitive", () => {
    expect(filterQuestions(qs, "THEFT").map((q) => q.id)).toEqual(["b"]);
    expect(filterQuestions(qs, "ThReE YeArS").map((q) => q.id)).toEqual(["a"]);
  });

  it("returns empty for a no-match query", () => {
    expect(filterQuestions(qs, "nonexistent zzz")).toEqual([]);
  });

  it("filters by category", () => {
    const res = filterQuestions(qs, "", "labor");
    expect(res.map((q) => q.id)).toEqual(["c"]);
  });

  it("combines category filter with a query", () => {
    expect(filterQuestions(qs, "three", "labor").map((q) => q.id)).toEqual(["c"]);
    // "three years" appears in the civil item, but the labor filter excludes it.
    expect(filterQuestions(qs, "years", "labor")).toEqual([]);
  });

  it("null/undefined category does not filter", () => {
    expect(filterQuestions(qs, "", null)).toHaveLength(3);
    expect(filterQuestions(qs, "", undefined)).toHaveLength(3);
  });

  it("does not mutate the input array", () => {
    const copy = [...qs];
    filterQuestions(qs, "theft", "criminal");
    expect(qs).toEqual(copy);
  });
});
