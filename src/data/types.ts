// Branch of law (question category).
export type Category =
  | "civil" // Civil
  | "criminal" // Criminal
  | "labor" // Labour
  | "family" // Family
  | "admin" // Administrative
  | "tax" // Tax
  | "constitutional"; // Constitutional / fundamentals

// Type of game question.
export type QuestionType =
  | "code" // "Which code?" — pick the branch/code
  | "article" // "Guess the article" — match a norm to an article
  | "myth" // "True/False" — a legal myth (true/false)
  | "case"; // "Case" — a short scenario

export type Difficulty = 1 | 2 | 3;

export interface Question {
  /** Unique stable identifier (used for progress in localStorage). */
  id: string;
  category: Category;
  type: QuestionType;
  /** Text of the question/situation. */
  prompt: string;
  /** Answer options (for "myth" — ["True", "False"]). */
  options: string[];
  /** Index of the correct option within options. */
  correctIndex: number;
  /** Why this particular norm applies — shown after the answer. */
  explanation: string;
  /** Reference to the norm for verification, e.g. "Art. 158, Criminal Code of the Russian Federation". */
  citation: string;
  difficulty: Difficulty;
}

export const CATEGORIES: Record<Category, { title: string; emoji: string }> = {
  civil: { title: "Civil", emoji: "🤝" },
  criminal: { title: "Criminal", emoji: "⚖️" },
  labor: { title: "Labour", emoji: "💼" },
  family: { title: "Family", emoji: "💍" },
  admin: { title: "Administrative", emoji: "🚦" },
  tax: { title: "Tax", emoji: "💰" },
  constitutional: { title: "Constitutional", emoji: "📜" },
};

export const QUESTION_TYPES: Record<QuestionType, { title: string }> = {
  code: { title: "Which code?" },
  article: { title: "Guess the article" },
  myth: { title: "True / False" },
  case: { title: "Case" },
};
