import { describe, it, expect } from "vitest";
// @ts-expect-error — plain .mjs validation helper shared with the CLI script.
import { loadDataset, validateDataset } from "../../scripts/validate-data.lib.mjs";

describe("open dataset (questions.json) validation", () => {
  it("passes JSON Schema validation and all semantic invariants", () => {
    const { questions, schema } = loadDataset();
    const { errors } = validateDataset(questions, schema);
    expect(errors).toEqual([]);
  });

  it("flags a dataset with an out-of-range correctIndex", () => {
    const { questions, schema } = loadDataset();
    const broken = structuredClone(questions);
    broken[0].correctIndex = 999;
    const { errors } = validateDataset(broken, schema);
    expect(errors.length).toBeGreaterThan(0);
  });
});
