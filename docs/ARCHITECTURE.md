# Architecture

Know the Law is a **100% client-side**, offline-capable web app. There is no
backend, no API, and no data collection — everything runs in the browser and all
user state lives in `localStorage`.

## High-level shape

```
index.html ──► src/main.ts (UI controller / screens)
                   │
                   ├── src/data/        Open dataset (the "model")
                   │     ├── questions.json     canonical data (CC BY 4.0)
                   │     ├── questions.schema.json  JSON Schema (draft 2020-12)
                   │     ├── questions.ts       typed import + public API
                   │     └── types.ts
                   │
                   └── src/lib/         Pure, unit-tested logic
                         ├── scoring.ts   score / combo / time bonus
                         ├── levels.ts    XP thresholds & ranks
                         ├── srs.ts        spaced repetition + mistakes queue
                         ├── stats.ts      lifetime stats & per-category accuracy
                         ├── study.ts      browse/search filtering
                         ├── answer.ts     answer checking
                         ├── share.ts      shareable result text
                         └── storage.ts    localStorage persistence + migration
```

## Design principles

- **Pure core, thin shell.** All game logic is implemented as pure functions in
  `src/lib`, which makes it fully unit-testable. `main.ts` is the only module that
  touches the DOM.
- **Data as a first-class artifact.** Questions are an open, schema-validated
  JSON dataset, not hard-coded UI strings. The schema is enforced in CI.
- **Privacy by construction.** No network calls at runtime; progress never leaves
  the device.
- **Offline-first.** A service worker (via `vite-plugin-pwa`) precaches the app
  so it works without a connection and is installable.

## Build & tooling

- **Vite + TypeScript** (strict) for the app and build.
- **Vitest** (+ v8 coverage) for unit tests.
- **Playwright** for end-to-end tests against the built app.
- **ESLint + Prettier** for code quality; **commitlint + husky** for commit
  hygiene.

See [`data-schema.md`](data-schema.md) for the dataset contract and
[`adr/`](adr/) for recorded architecture decisions.
