/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the app works under the GitHub Pages project subpath
  // (https://<user>.github.io/zakon-quest/) as well as at the domain root.
  base: "./",
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Only the pure, testable logic and the open dataset are measured.
      // Browser-only glue (main.ts entrypoint, storage.ts localStorage wrapper)
      // is exercised by hand/E2E, not unit tests, and would distort the signal.
      include: ["src/lib/**/*.ts", "src/data/questions.ts"],
      exclude: ["src/lib/storage.ts", "**/*.test.ts"],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 85,
      },
    },
  },
});
