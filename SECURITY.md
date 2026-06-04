# Security Policy

We take the security and integrity of **Know the Law** seriously — both the
application and the published question dataset.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

We support the latest minor release on the `1.x` line. Security fixes are
released as patch versions.

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately using
[GitHub Private Vulnerability Reporting](https://github.com/goshrum/zakon-quest/security/advisories/new),
or contact the maintainer listed in [`MAINTAINERS.md`](MAINTAINERS.md).

Please include:

- A description of the issue and its impact
- Steps to reproduce (a proof of concept if possible)
- Affected version(s)

### Response targets

- **Acknowledgement:** within 3 business days
- **Initial assessment:** within 7 business days
- **Fix or mitigation plan:** communicated after assessment

## Scope

This is a fully client-side static web app with **no backend and no runtime
secrets**. User data (progress, stats) stays in the browser's `localStorage` and
never leaves the device. Relevant security concerns include: cross-site
scripting (XSS) in rendered question content, dependency vulnerabilities, and
service-worker/PWA caching issues. Dependency scanning runs via Dependabot and
CodeQL. Reports about the **accuracy of legal content** are handled as data
issues — see [`docs/CONTENT_POLICY.md`](docs/CONTENT_POLICY.md).
