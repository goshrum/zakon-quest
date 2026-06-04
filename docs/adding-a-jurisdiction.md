# Adding a new jurisdiction

The dataset is structured so the project can grow beyond a single legal system.
This is the main way the project delivers value to the wider ecosystem: a
reusable engine plus open, per-jurisdiction question packs.

## The idea

- Each jurisdiction is an independent dataset that conforms to the shared
  [question schema](data-schema.md).
- The quiz engine (`src/lib`) is jurisdiction-agnostic — it scores, tracks, and
  schedules questions regardless of their legal content.
- Categories may be adapted per jurisdiction (the set of legal branches differs
  by country), but the object shape stays the same.

## Proposing a new jurisdiction

1. Open a Discussion describing the jurisdiction and who will maintain its
   accuracy (content needs a domain-literate maintainer).
2. Provide an initial pack of questions following the schema, each with a
   **citation** to that jurisdiction's authoritative legal sources.
3. Run `npm run validate:data` against the new pack.
4. Submit a PR. Content is reviewed under the [Content Policy](CONTENT_POLICY.md).

## Why this matters

Legal-literacy resources are scarce and fragmented, especially as open,
machine-readable, citable data. By keeping the dataset open (CC BY 4.0) and
schema-validated, other educators, apps, and researchers can build on it.
