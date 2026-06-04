# Question dataset schema

The question bank is an open dataset published at
[`src/data/questions.json`](../src/data/questions.json) and formally described by
[`src/data/questions.schema.json`](../src/data/questions.schema.json)
(JSON Schema, draft 2020-12). It is licensed under **CC BY 4.0** (see
[`LICENSE-DATA`](../LICENSE-DATA)) so it can be reused in other projects.

Validate it any time with:

```bash
npm run validate:data
```

## A question object

| Field          | Type     | Rules                                                             |
| -------------- | -------- | ----------------------------------------------------------------- |
| `id`           | string   | Unique across the dataset.                                        |
| `category`     | enum     | One of the legal branches (see below).                            |
| `type`         | enum     | `code` · `article` · `myth` · `case`.                             |
| `prompt`       | string   | The question text shown to the player.                            |
| `options`      | string[] | 2+ answer options.                                                |
| `correctIndex` | integer  | 0-based index into `options`; must be in range.                   |
| `explanation`  | string   | Non-empty; explains _why_ the answer is correct.                  |
| `citation`     | string   | Non-empty; the source norm, e.g. "Art. 158, Criminal Code of RF". |
| `difficulty`   | enum     | `easy` · `medium` · `hard`.                                       |

### Categories

`criminal`, `civil`, `labour`, `family`, `administrative`, `tax`, `housing`
(each rendered with a friendly title and emoji in the UI).

### Question types

- **`code`** — given a situation, pick the governing code.
- **`article`** — match an offense/right to its article number.
- **`myth`** — a true/false legal myth (`options` are `["True","False"]`).
- **`case`** — a short scenario; choose the applicable norm/answer.

## Example

```json
{
  "id": "crim-theft-code",
  "category": "criminal",
  "type": "code",
  "prompt": "Which code governs liability for theft?",
  "options": ["Criminal Code", "Civil Code", "Administrative Offences Code", "Tax Code"],
  "correctIndex": 0,
  "explanation": "Theft is a crime defined and punished by the Criminal Code.",
  "citation": "Art. 158, Criminal Code of the Russian Federation",
  "difficulty": "easy"
}
```

## Adding or fixing questions

See [`../CONTRIBUTING.md`](../CONTRIBUTING.md) and
[`CONTENT_POLICY.md`](CONTENT_POLICY.md). Every question must cite a verifiable,
stable source; the validator and CI reject malformed entries.
