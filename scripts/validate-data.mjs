#!/usr/bin/env node
// Validates the open question dataset (src/data/questions.json) against its
// JSON Schema (src/data/questions.schema.json) and a set of semantic
// invariants that a schema alone cannot express. Exits non-zero on any problem
// so it can gate CI. The validation logic is shared with the Vitest test via
// validate-data.lib.mjs.

import { loadDataset, validateDataset } from "./validate-data.lib.mjs";

const { questions, schema } = loadDataset();
const { errors, categories, types } = validateDataset(questions, schema);

if (errors.length > 0) {
  console.error(`✗ Dataset validation FAILED with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✓ Dataset valid: ${questions.length} questions, ${categories.size} categories, ${types.size} types.`);
