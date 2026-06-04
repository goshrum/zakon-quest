# Contributing to Know the Law

Thank you for your interest in contributing! This project is an open,
schema-validated dataset of legal-literacy questions plus a reusable quiz
engine. Contributions of all kinds are welcome: bug fixes, new questions,
corrections to existing questions, documentation, accessibility, and new
features.

By participating you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Table of contents

- [Development setup](#development-setup)
- [Running the project](#running-the-project)
- [Project scripts](#project-scripts)
- [Conventional Commits](#conventional-commits)
- [Branch and PR workflow](#branch-and-pr-workflow)
- [How reviews work](#how-reviews-work)
- [How to add or fix a question](#how-to-add-or-fix-a-question)
- [Code style](#code-style)

## Development setup

You need [Node.js](https://nodejs.org/) 18, 20, or 22. The pinned version lives
in [`.nvmrc`](.nvmrc); if you use [nvm](https://github.com/nvm-sh/nvm), run:

```bash
nvm use
```

Then install dependencies:

```bash
npm install
```

This also sets up [husky](https://typicode.github.io/husky/) git hooks that run
linting and commit-message checks locally.

## Running the project

```bash
npm run dev      # start the Vite dev server with hot reload
npm run build    # type-check (tsc --noEmit) and build into dist/
npm run preview  # preview the production build locally
```

## Project scripts

| Script                  | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Local dev server (Vite).                                  |
| `npm run build`         | Type-check and production build into `dist/`.             |
| `npm run preview`       | Serve the production build locally.                       |
| `npm test`              | Run unit tests (Vitest).                                  |
| `npm run test:coverage` | Run tests with v8 coverage and thresholds.                |
| `npm run lint`          | Lint with ESLint.                                         |
| `npm run format`        | Format the codebase with Prettier.                        |
| `npm run format:check`  | Check formatting without writing.                         |
| `npm run typecheck`     | Type-check with `tsc --noEmit`.                           |
| `npm run validate:data` | Validate the question dataset against the JSON schema.    |
| `npm run lint:md`       | Lint Markdown docs.                                       |
| `npm run e2e`           | Run Playwright end-to-end tests against a preview server. |

Before opening a pull request, please make sure these all pass:

```bash
npm run lint
npm run typecheck
npm test
npm run validate:data
npm run build
```

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
Commit messages are linted by [commitlint](https://commitlint.js.org/) via a
`commit-msg` git hook, and they drive automated releases and the changelog.

Format:

```text
<type>[optional scope]: <description>
```

Common types:

- `feat` — a new feature.
- `fix` — a bug fix.
- `docs` — documentation only.
- `data` — additions or corrections to the question dataset.
- `test` — adding or fixing tests.
- `chore` — tooling, build, or maintenance.
- `ci` — CI configuration and workflows.
- `refactor` — code change that neither fixes a bug nor adds a feature.

Examples:

```text
feat(engine): add speed bonus to scoring
fix(study): clear search when returning to the menu
data: correct citation for the theft question
docs: document the dataset schema
```

## Branch and PR workflow

1. Fork the repository (or create a branch if you have write access).
2. Create a topic branch: `git checkout -b feat/short-description`.
3. Make your changes with focused, Conventional-Commit commits.
4. Run the full check list above and make sure it is green.
5. Push your branch and open a pull request against `main`.
6. Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md)
   checklist.
7. Keep the PR scoped — small, reviewable changes are merged faster.

CI (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint,
format check, type-check, data validation, tests with coverage, and a build on
Node 18, 20, and 22. End-to-end tests, CodeQL, and other checks also run.

## How reviews work

- A maintainer (see [MAINTAINERS.md](MAINTAINERS.md)) reviews every PR. Review
  ownership is encoded in [`.github/CODEOWNERS`](.github/CODEOWNERS).
- Reviewers look for: correctness, test coverage, accessibility, English-only
  content (zero Cyrillic), data accuracy with citations, and adherence to the
  code style.
- Address review comments by pushing additional commits; we squash-merge so the
  history stays clean.
- Decisions and the path to becoming a maintainer are described in
  [GOVERNANCE.md](GOVERNANCE.md).

## How to add or fix a question

The question bank is a **first-class, open, schema-validated dataset**. It lives
in two places that must stay in sync:

- [`src/data/questions.json`](src/data/questions.json) — the canonical dataset.
- [`src/data/questions.schema.json`](src/data/questions.schema.json) — the JSON
  Schema (Draft 2020-12) that every entry must satisfy.

Full field documentation is in [docs/data-schema.md](docs/data-schema.md), and
the content/accuracy rules are in
[docs/CONTENT_POLICY.md](docs/CONTENT_POLICY.md).

### Step by step

1. Open `src/data/questions.json`.
2. Add (or edit) a question object. Every field is required:

   ```json
   {
     "id": "civil-purchase-sale-code",
     "category": "civil",
     "type": "code",
     "prompt": "Which code governs a contract of purchase and sale?",
     "options": ["Civil Code", "Tax Code", "Labour Code", "Family Code"],
     "correctIndex": 0,
     "explanation": "Contracts of purchase and sale are governed by the Civil Code.",
     "citation": "Art. 454, Civil Code of the Russian Federation",
     "difficulty": 1
   }
   ```

   - `id` — unique, stable, lowercase-kebab-case (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
     Never reuse or renumber an existing id; progress is keyed on it.
   - `category` — one of `civil`, `criminal`, `labor`, `family`, `admin`, `tax`,
     `constitutional`.
   - `type` — one of `code`, `article`, `myth`, `case`. For `myth`, `options`
     must be exactly `["True", "False"]`.
   - `correctIndex` — zero-based index into `options`.
   - `citation` — **required**. Every question must cite a verifiable norm.
   - `difficulty` — `1`, `2`, or `3`.
   - Content must be in **English only** (zero Cyrillic characters).

3. Validate the dataset against the schema:

   ```bash
   npm run validate:data
   ```

4. Run the data-integrity unit tests, which additionally check for duplicate
   ids, duplicate options, a valid `correctIndex`, and English-only text:

   ```bash
   npm test
   ```

5. Commit with a `data:` type, e.g. `data: add purchase-and-sale question`, and
   open a PR using the
   [new/fix question issue form](.github/ISSUE_TEMPLATE/new_or_fix_question.yml)
   as a reference for the information to provide (source URL, exact citation).

### Reporting a wrong question without coding

If you spot an incorrect question but do not want to edit JSON, open an issue
using the **New or fix a question** form and include the exact citation and a
source URL. A maintainer will fix it.

## Code style

- TypeScript, formatted with [Prettier](https://prettier.io/) and linted with
  [ESLint](https://eslint.org/). Run `npm run format` before committing; the
  pre-commit hook will also auto-fix staged files.
- Keep game logic in **pure functions** under `src/lib/` with unit tests. UI
  wiring lives in `src/main.ts`.
- Preserve accessibility: landmarks, focus management, live regions, and
  keyboard support.

Happy contributing!
