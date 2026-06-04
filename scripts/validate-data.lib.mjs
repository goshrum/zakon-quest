// Shared validation logic for the open question dataset, used by both the
// CLI script (scripts/validate-data.mjs) and a Vitest test so CI covers it.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_PATH = resolve(__dirname, "../src/data/questions.json");
export const SCHEMA_PATH = resolve(__dirname, "../src/data/questions.schema.json");

const KNOWN_CATEGORIES = new Set(["civil", "criminal", "labor", "family", "admin", "tax", "constitutional"]);
const KNOWN_TYPES = new Set(["code", "article", "myth", "case"]);
// Built from escapes so this file itself stays free of literal Cyrillic.
const CYRILLIC = new RegExp("[\\u0400-\\u04FF]");

/**
 * Validate the dataset against the JSON Schema and semantic invariants.
 * @returns {{ errors: string[], questions: unknown[], categories: Set<string>, types: Set<string> }}
 */
export function validateDataset(questions, schema) {
  const errors = [];

  // 1) JSON Schema validation (draft 2020-12).
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(questions)) {
    for (const e of validate.errors ?? []) {
      errors.push(`schema ${e.instancePath || "/"} ${e.message}`);
    }
  }

  const seenIds = new Set();
  const seenCategories = new Set();
  const seenTypes = new Set();

  for (const q of questions) {
    const where = `question "${q?.id ?? "<unknown>"}"`;

    if (seenIds.has(q.id)) errors.push(`${where}: duplicate id`);
    seenIds.add(q.id);

    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      errors.push(`${where}: correctIndex ${q.correctIndex} out of range (0..${q.options.length - 1})`);
    }

    for (const field of ["prompt", "explanation", "citation"]) {
      if (typeof q[field] !== "string" || q[field].trim().length === 0) {
        errors.push(`${where}: empty ${field}`);
      }
    }

    if (q.type === "myth") {
      if (!(q.options.length === 2 && q.options[0] === "True" && q.options[1] === "False")) {
        errors.push(`${where}: myth options must be ["True", "False"]`);
      }
    }

    const fields = [q.id, q.prompt, q.explanation, q.citation, ...(q.options ?? [])];
    for (const f of fields) {
      if (typeof f === "string" && CYRILLIC.test(f)) {
        errors.push(`${where}: Cyrillic found in "${f}"`);
      }
    }

    seenCategories.add(q.category);
    seenTypes.add(q.type);
  }

  for (const cat of KNOWN_CATEGORIES) {
    if (!seenCategories.has(cat)) errors.push(`category "${cat}" has no questions`);
  }
  for (const type of KNOWN_TYPES) {
    if (!seenTypes.has(type)) errors.push(`type "${type}" has no questions`);
  }

  return { errors, questions, categories: seenCategories, types: seenTypes };
}

/** Load the canonical dataset and schema from disk. */
export function loadDataset() {
  const questions = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  return { questions, schema };
}
