/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Relative base so the app and its service worker work under the GitHub Pages
  // project subpath (https://<user>.github.io/zakon-quest/) as well as at root.
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      // Auto-injects the service-worker registration script into the built
      // index.html, so no virtual import is needed in app code.
      injectRegister: "auto",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Know the Law",
        short_name: "Know the Law",
        description: "An educational quiz game about the basics of the Russian legal system. Not legal advice.",
        theme_color: "#0f1226",
        background_color: "#0f1226",
        display: "standalone",
        orientation: "portrait",
        // Relative scope/start so the PWA installs correctly under a subpath.
        scope: "./",
        start_url: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json,ico,woff2}"],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
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
