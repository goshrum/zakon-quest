# 📜 Know the Law

An educational quiz game about the basics of the Russian legal system. Guess the
right code, recall the "iconic" article numbers, and tell legal myths apart from
real norms — all with points, combos, levels and ranks (from *Newcomer* to
*Supreme Court Justice*).

A 100% static, client-side app: no backend, no paid APIs, no network requests
during play. Free forever, hosted on GitHub Pages. The interface and all content
are in English; the subject matter is the Russian legal system, and every
question carries a legal citation so you can verify it yourself.

## ⚠️ Accuracy disclaimer

This is an **educational game, not legal advice**. The content is limited to
stable, well-known norms that rarely change. Even so, legislation changes —
**always verify against the current edition** at
[pravo.gov.ru](http://pravo.gov.ru) or in ConsultantPlus.

Content accuracy policy:

- Only facts we are highly confident are correct and stable are included.
- Where the exact article number is not absolutely reliable, the question is
  phrased about the **code/branch** ("which code governs…") rather than the exact
  number.
- **Every** question carries a `citation` field (for example,
  `Art. 158, Criminal Code of the Russian Federation`), shown after the answer
  for self-checking.
- Fewer rock-solid questions are preferred over many debatable ones.

## Features

- 4 question types: "Which code?", "Guess the article", "True / False", and
  "Case".
- 7 branches of law: civil, criminal, labour, family, administrative, tax and
  constitutional — selectable before a round.
- Points with a combo multiplier for streaks and a speed bonus (optional timer).
- XP, levels and fun legal ranks, with a progress bar.
- Spaced repetition: questions you got wrong come back sooner, mastered ones less
  often. Progress is stored in `localStorage`.
- "Review your mistakes" mode that replays only the questions you previously
  missed.
- After every answer — an explanation of "why this norm" plus a citation.
- Keyboard shortcuts: press 1–4 to answer, Enter to continue.
- An optional sound toggle for correct/wrong feedback, persisted.
- Results screen with "share your result" (copies text, no network).
- A juicy, responsive UI: animations, combo flashes, dark/light theme, mobile
  layout, and `prefers-reduced-motion` support.

## Running

```bash
npm install
npm run dev      # local development (Vite)
npm run build    # tsc --noEmit + build into dist/
npm run preview  # preview the built version
npm test         # unit tests (Vitest)
```

## Deploying to GitHub Pages

1. Create a repository on GitHub and push the code to the `main` branch.
2. In *Settings → Pages → Build and deployment*, choose **GitHub Actions**.
3. The `.github/workflows/deploy.yml` workflow runs the tests, builds the project
   and publishes `dist/`. `base: './'` in `vite.config.ts` makes the build work
   from a Pages subdirectory.

## Adding your own questions

Questions live in `src/data/questions.ts` (the `QUESTIONS` array). The schema is
described in `src/data/types.ts`. Each object:

```ts
{
  id: "unique-stable-id",            // string, used for progress in localStorage
  category: "civil",                  // civil | criminal | labor | family | admin | tax | constitutional
  type: "code",                       // code | article | myth | case
  prompt: "Text of the question/situation",
  options: ["Option A", "Option B"], // for type "myth" strictly ["True", "False"]
  correctIndex: 0,                    // index of the correct option in options
  explanation: "Why this norm (shown after the answer)",
  citation: "Art. 454, Civil Code of the Russian Federation", // verification reference — required
  difficulty: 1                       // 1 | 2 | 3
}
```

The data-integrity test (`src/data/questions.test.ts`) automatically checks every
object: a valid `correctIndex` within `options`, non-empty `citation` and
`explanation`, correct `category`/`type`, unique `id`s and options, and that no
field contains Cyrillic characters. Add an invalid question and `npm test` fails.
This protects the structure and accuracy of the content.

## Architecture

- `src/data/` — data and schema (questions, types, categories).
- `src/lib/` — **pure functions** for game logic, covered by tests:
  - `scoring.ts` — points, combo multiplier, time bonus, accuracy.
  - `levels.ts` — XP thresholds, ranks, level progress.
  - `srs.ts` — the spaced-repetition queue.
  - `answer.ts` — answer checking, category filtering, deterministic shuffle.
  - `share.ts` — the "share" text.
  - `storage.ts` — a thin wrapper over `localStorage` (the only I/O).
- `src/main.ts` — UI and wiring (screen rendering, timer, animations, keyboard,
  sound).

## Limitations (honestly)

- The content is deliberately basic: well-known principles and "iconic" articles.
  It does **not** cover editorial nuances, regional law, case law, or threshold
  amounts (which change).
- Article numbers and thresholds may change over time — the `citation` is given
  precisely so you can re-check against the current edition.
- Progress is stored only in the current browser's `localStorage`: clearing data
  or using another browser/device means starting over. There is no cross-device
  sync (a deliberate zero-cost / no-backend choice).
- This is a game, not a reference system and not a substitute for advice from a
  lawyer.

## License

MIT © 2026 georgerum07
