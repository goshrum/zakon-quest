import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Build output, deps and generated assets are not linted.
    ignores: ["dist/**", "coverage/**", "node_modules/**", "dev-dist/**", "public/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        AudioContext: "readonly",
        HTMLInputElement: "readonly",
        HTMLElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLSelectElement: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        alert: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    // Node scripts use Node built-ins and process.
    files: ["scripts/**/*.mjs", "*.config.{js,ts,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        URL: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      // CLI scripts print user-facing progress/results to stdout.
      "no-console": "off",
    },
  },
);
