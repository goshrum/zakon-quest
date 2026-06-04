import type { Question } from "./types";
import questionsData from "./questions.json";

// The canonical question bank lives in `questions.json` as a first-class, open,
// schema-validated dataset (see `questions.schema.json`). It is imported here
// and exposed as a typed `Question[]` so the app and tests keep their existing
// API. Do not edit questions here — edit `questions.json` instead.
//
// IMPORTANT: only stable, well-known norms. Where the article number is not
// absolutely reliable, the question asks about the code/branch rather than the
// exact number. Every question has an explanation and a citation for
// self-verification.

export const QUESTIONS: Question[] = questionsData as Question[];
