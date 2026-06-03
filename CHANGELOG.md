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

- **Review your mistakes** mode: replays only the questions you previously got
  wrong, using the existing spaced-repetition data. Surfaced on the start screen
  with a live count of outstanding mistakes.
- **Keyboard shortcuts**: press `1`–`4` to choose an answer and `Enter` to
  advance to the next question or to the results.
- **Sound toggle**: optional audio feedback for correct/wrong answers, generated
  with the Web Audio API and persisted in `localStorage`.
- A data-integrity test that fails if any question field contains Cyrillic
  characters, plus unit tests for the new `mistakeIds` helper.
