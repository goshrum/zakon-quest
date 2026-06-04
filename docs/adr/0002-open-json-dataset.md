# 2. Treat the question bank as an open JSON dataset

- Status: accepted
- Date: 2026-06-04

## Context

The questions started life as a TypeScript array embedded in the app. That makes
the content hard to reuse outside the app, hard to validate independently, and
couples data to code.

## Decision

The canonical question bank lives in `src/data/questions.json`, described by a
JSON Schema (`questions.schema.json`) and validated in CI (`npm run validate:data`).
The TypeScript layer imports the JSON and exposes a typed API, so the app is
unchanged. The dataset is licensed separately under CC BY 4.0.

## Consequences

- The dataset is reusable by third parties and citable as an artifact.
- Content integrity is enforced mechanically (schema + invariants + CI).
- New jurisdictions can be added as additional datasets without touching engine
  code (see `docs/adding-a-jurisdiction.md`).
- A small build step / typed import is required to consume JSON in TypeScript.
