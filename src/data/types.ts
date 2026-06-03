// Тип отрасли права (категория вопроса).
export type Category =
  | "civil" // Гражданское
  | "criminal" // Уголовное
  | "labor" // Трудовое
  | "family" // Семейное
  | "admin" // Административное
  | "tax" // Налоговое
  | "constitutional"; // Конституционное / основы

// Тип игрового вопроса.
export type QuestionType =
  | "code" // "Какой кодекс?" — выбрать отрасль/кодекс
  | "article" // "Угадай статью" — сопоставить норму со статьёй
  | "myth" // "Верю/не верю" — правовой миф (true/false)
  | "case"; // "Кейс" — короткий сценарий

export type Difficulty = 1 | 2 | 3;

export interface Question {
  /** Уникальный стабильный идентификатор (используется для прогресса в localStorage). */
  id: string;
  category: Category;
  type: QuestionType;
  /** Текст вопроса/ситуации. */
  prompt: string;
  /** Варианты ответа (для "myth" — ["Верю", "Не верю"]). */
  options: string[];
  /** Индекс правильного варианта внутри options. */
  correctIndex: number;
  /** Почему именно эта норма — показывается после ответа. */
  explanation: string;
  /** Ссылка на норму для проверки, напр. "ст. 158 УК РФ". */
  citation: string;
  difficulty: Difficulty;
}

export const CATEGORIES: Record<Category, { title: string; emoji: string }> = {
  civil: { title: "Гражданское", emoji: "🤝" },
  criminal: { title: "Уголовное", emoji: "⚖️" },
  labor: { title: "Трудовое", emoji: "💼" },
  family: { title: "Семейное", emoji: "💍" },
  admin: { title: "Административное", emoji: "🚦" },
  tax: { title: "Налоговое", emoji: "💰" },
  constitutional: { title: "Конституционное", emoji: "📜" },
};

export const QUESTION_TYPES: Record<QuestionType, { title: string }> = {
  code: { title: "Какой кодекс?" },
  article: { title: "Угадай статью" },
  myth: { title: "Верю / не верю" },
  case: { title: "Кейс" },
};
