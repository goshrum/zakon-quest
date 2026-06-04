# 1. Record architecture decisions

- Status: accepted
- Date: 2026-06-04

## Context

We want a lightweight, durable record of the significant decisions behind the
project so future contributors understand _why_ things are the way they are.

## Decision

We use Architecture Decision Records (ADRs), one Markdown file per decision in
`docs/adr/`, numbered sequentially. The format is intentionally minimal:
Context, Decision, Consequences.

## Consequences

- Decisions are discoverable and reviewable in pull requests.
- The history of the project's direction is preserved alongside the code.
