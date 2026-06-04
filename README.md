# 📜 Know the Law

> An open, schema-validated dataset of legal-literacy questions **and** a
> privacy-first quiz game that runs entirely in your browser — no server, no
> accounts, no tracking, works offline.

[![CI](https://github.com/goshrum/zakon-quest/actions/workflows/ci.yml/badge.svg)](https://github.com/goshrum/zakon-quest/actions/workflows/ci.yml)
[![E2E](https://github.com/goshrum/zakon-quest/actions/workflows/e2e.yml/badge.svg)](https://github.com/goshrum/zakon-quest/actions/workflows/e2e.yml)
[![CodeQL](https://github.com/goshrum/zakon-quest/actions/workflows/codeql.yml/badge.svg)](https://github.com/goshrum/zakon-quest/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Dataset: CC BY 4.0](https://img.shields.io/badge/dataset-CC%20BY%204.0-lightgrey.svg)](LICENSE-DATA)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/commits-conventional-fe5196.svg)](https://www.conventionalcommits.org)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](tsconfig.json)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8.svg)](#-install--offline)

**▶ Live demo: <https://goshrum.github.io/zakon-quest/>**

---

## Table of contents

- [Why this project](#why-this-project)
- [Features](#features)
- [The open dataset](#-the-open-dataset)
- [Quick start](#-quick-start)
- [Install & offline](#-install--offline)
- [Project scripts](#project-scripts)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Governance & maintainers](#governance--maintainers)
- [Security](#security)
- [Roadmap](#roadmap)
- [License](#license)

## Why this project

Legal-literacy material is scarce, fragmented, and rarely available as **open,
machine-readable, citable data**. Know the Law tackles both halves of that
problem:

1. **An open dataset** of legal-literacy questions — every entry carries a
   citation to a verifiable, stable source, validated by a JSON Schema in CI, and
   published under CC BY 4.0 so anyone can reuse it.
2. **A delightful way to learn it** — a fast, accessible, offline-capable quiz
   game that turns the dataset into practice, with scoring, streaks, levels,
   spaced repetition, and a study/browse mode.

The quiz engine is deliberately **jurisdiction-agnostic**: the current dataset
covers the Russian legal system (in English), and the project is structured so
contributors can add other jurisdictions as separate datasets. See
[`docs/adding-a-jurisdiction.md`](docs/adding-a-jurisdiction.md).

> ⚖️ **Educational only — not legal advice.** Norms change over time; every
> question cites its source so you can verify it. See
> [`docs/CONTENT_POLICY.md`](docs/CONTENT_POLICY.md).

## Features

- 🎯 **Four question types** — pick the governing code, guess the article,
  true/false legal myths, and short case scenarios.
- 🔥 **Game feel** — combo multipliers, optional timer + speed bonus, XP, ranks,
  and a results screen.
- 🧠 **Spaced repetition** — questions you miss come back; a dedicated
  _review your mistakes_ mode.
- 📚 **Study mode** — searchable, pressure-free browse of every question with its
  answer, explanation, and citation.
- 📊 **Lifetime stats** — accuracy overall and per legal branch.
- ♿ **Accessible** — keyboard support, focus management, ARIA live regions,
  reduced-motion support, skip link.
- 🔒 **Private & offline** — 100% client-side, installable PWA, progress stored
  only in your browser.

## 📦 The open dataset

The question bank is a first-class artifact, not hard-coded strings:

- Canonical data: [`src/data/questions.json`](src/data/questions.json)
- Contract: [`src/data/questions.schema.json`](src/data/questions.schema.json)
  (JSON Schema, draft 2020-12)
- Docs: [`docs/data-schema.md`](docs/data-schema.md)
- License: **CC BY 4.0** — [`LICENSE-DATA`](LICENSE-DATA)

Validate it anytime:

```bash
npm run validate:data
```

Reuse it in your own project, cite it (see [`CITATION.cff`](CITATION.cff)), and
contribute corrections — citation-backed fixes are fast-tracked.

## 🚀 Quick start

Requires Node 18, 20, or 22 (see [`.nvmrc`](.nvmrc)).

```bash
git clone https://github.com/goshrum/zakon-quest.git
cd zakon-quest
npm install
npm run dev        # start the dev server
```

Build and preview a production bundle:

```bash
npm run build
npm run preview
```

## 📲 Install & offline

The app is a Progressive Web App. Open the live demo and use your browser's
**Install** action to add it to your device. Once loaded, it works fully offline
— the service worker precaches the app shell, and there are no network calls at
runtime.

## Project scripts

| Script                  | What it does                            |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start the Vite dev server               |
| `npm run build`         | Type-check and build for production     |
| `npm run preview`       | Preview the production build            |
| `npm test`              | Run unit tests (Vitest)                 |
| `npm run test:coverage` | Unit tests with coverage thresholds     |
| `npm run e2e`           | End-to-end tests (Playwright)           |
| `npm run lint`          | ESLint                                  |
| `npm run format`        | Format with Prettier                    |
| `npm run typecheck`     | TypeScript, no emit                     |
| `npm run validate:data` | Validate the dataset against the schema |

## Architecture

A pure, unit-tested core (`src/lib`) with a thin DOM shell (`src/main.ts`) over
an open dataset (`src/data`). Full write-up in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); decisions are recorded as ADRs in
[`docs/adr/`](docs/adr/).

## Contributing

Contributions of all kinds are welcome — code, accessibility, docs, and
especially **citation-backed question fixes and additions**. Start with
[`CONTRIBUTING.md`](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). We use
[Conventional Commits](https://www.conventionalcommits.org) and automate releases
with [release-please](https://github.com/googleapis/release-please).

## Governance & maintainers

This project has documented [governance](GOVERNANCE.md) and a
[maintainers](MAINTAINERS.md) list describing roles, decision-making, releases,
and how to become a maintainer.

## Security

Found a vulnerability? Please report it privately — see
[`SECURITY.md`](SECURITY.md). Dependencies are monitored with Dependabot and the
code is scanned with CodeQL.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for what's planned and where help is most useful.

## License

- **Code:** [MIT](LICENSE)
- **Question dataset:** [CC BY 4.0](LICENSE-DATA)
