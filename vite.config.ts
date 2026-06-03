import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  test: {
    globals: true,
    environment: "node",
  },
});
