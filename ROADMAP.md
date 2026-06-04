# Roadmap

This roadmap is intentionally public so contributors can see where help is most
valuable. It is a living document — priorities shift based on feedback. Items
map to issues labeled `roadmap`.

## Now (1.x)

- Grow the verified question bank with citations across all branches of law
- Tighten the dataset JSON Schema and validation (more invariants, CI gating)
- Improve accessibility to a documented WCAG 2.1 AA baseline
- Expand end-to-end (Playwright) coverage of core user flows

## Next

- **Multi-jurisdiction support** — generalize the dataset so contributors can add
  other countries' legal systems as separate, independently-licensed datasets
  (see [`docs/adding-a-jurisdiction.md`](docs/adding-a-jurisdiction.md))
- Internationalization (i18n) of the UI
- A "daily challenge" mode and shareable result cards
- Extract the quiz engine into a reusable, documented module

## Later

- Community-contributed question packs with a review/verification workflow
- Optional spaced-repetition scheduling improvements
- Public dataset releases versioned alongside app releases

## Non-goals

- Collecting personal data or adding a backend (the app stays 100% client-side)
- Providing legal advice — this is an educational tool only
