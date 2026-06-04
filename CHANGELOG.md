# Changelog

All notable changes to this project are documented here. The format is loosely
based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed

- Rebranded the app to **Know the Law** and localized the entire interface and
  all content to English. The subject matter remains the Russian legal system;
  only the language changed — facts, article numbers and applicable codes are
  unchanged. Citations are now expressed in English (for example,
  "Art. 158, Criminal Code of the Russian Federation").

### Added

- **Study / Browse mode**: a searchable, pressure-free reference screen reachable
  from the start screen via a "Study" button (with a back button). It lists every
  question showing the prompt, the clearly marked correct answer, the explanation,
  the citation and the category. A live search box filters the list
  case-insensitively across the prompt, explanation, citation and category, with an
  optional single-category filter and a "Showing X of Y" result count. Filtering is
  a pure function in `src/lib/study.ts` (`filterQuestions`) with full unit-test
  coverage. Added stable `data-testid` attributes to key interactive elements for
  end-to-end testing: `start-quiz`, `open-study`, `study-search`, `study-list`,
  `study-item`, `study-back`.
- **Stats / Profile screen**: a dedicated screen, reachable from the start
  screen via a "Stats" button (with a back button), showing lifetime progress —
  total questions answered, overall accuracy, best streak ever, current rank/XP,
  and a per-category accuracy breakdown (correct/total and a progress bar for
  each legal category). Lifetime stats are persisted in `localStorage` alongside
  existing progress and updated after every answer. Older saves are migrated
  gracefully: missing fields default to zero and the legacy top-level totals
  seed the new lifetime stats. Aggregation lives in pure functions in
  `src/lib/stats.ts` (`updateStats`, `computeAccuracyByCategory`,
  `migrateStats`, `overallAccuracy`) with full unit-test coverage.
- **Review your mistakes** mode: replays only the questions you previously got
  wrong, using the existing spaced-repetition data. Surfaced on the start screen
  with a live count of outstanding mistakes.
- **Keyboard shortcuts**: press `1`–`4` to choose an answer and `Enter` to
  advance to the next question or to the results.
- **Sound toggle**: optional audio feedback for correct/wrong answers, generated
  with the Web Audio API and persisted in `localStorage`.
- A data-integrity test that fails if any question field contains Cyrillic
  characters, plus unit tests for the new `mistakeIds` helper.
