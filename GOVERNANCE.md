# Governance

This document describes how the **Know the Law** project is run.

## Roles

### Users

Anyone who uses the app or the dataset. Feedback, bug reports, and content
corrections are valuable contributions.

### Contributors

Anyone who submits a pull request, files a well-formed issue, triages issues, or
improves documentation or the dataset. Contributors agree to the
[Code of Conduct](CODE_OF_CONDUCT.md) and the
[Contributing guide](CONTRIBUTING.md).

### Maintainers

Maintainers carry ongoing responsibility for the project. They:

- Review and merge pull requests
- Triage and label incoming issues
- Cut and publish releases
- Uphold security and content-accuracy standards
- Mentor contributors

Current maintainers are listed in [`MAINTAINERS.md`](MAINTAINERS.md).

## Decision making

Most decisions are made by **lazy consensus**: a proposal (issue or PR) that
receives no sustained objection within a reasonable review window is accepted.
Substantive changes require approval from at least one maintainer. Disagreements
are resolved through discussion; if consensus cannot be reached, the maintainers
make the final call, optimizing for the project's mission and its users.

## Content decisions

Because this project teaches law, factual accuracy is paramount. Changes to the
question dataset must follow [`docs/CONTENT_POLICY.md`](docs/CONTENT_POLICY.md):
every question must cite a verifiable, stable source, and corrections backed by a
citation take priority.

## Becoming a maintainer

Contributors who show sustained, high-quality involvement — reviewing PRs,
triaging issues, improving the dataset or codebase — may be invited to become
maintainers by the existing maintainers. There is no fixed quota.

## Releases

Releases follow [Semantic Versioning](https://semver.org) and are automated with
[release-please](https://github.com/googleapis/release-please) driven by
[Conventional Commits](https://www.conventionalcommits.org). A release is owned
by the maintainer who merges the release PR.
