/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The structure's short names, as in tsconfig.app.json's paths.
  resolve: {
    alias: Object.fromEntries(
      ["routes", "features", "shared", "services", "testing"].map((dir) => [
        `@${dir}`,
        fileURLToPath(new URL(`./src/${dir}`, import.meta.url)),
      ]),
    ),
  },
  server: {
    proxy: {
      // Keeps the browser's address (no changeOrigin) and sends X-Forwarded-*, so the
      // API builds its links, Google's callback included, on localhost:5173.
      "/api": { target: "http://localhost:8080", xfwd: true },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/testing/setup.ts"],
    // Every test starts clean (docs/testing.md): each file in its own environment, and every spy,
    // stubbed global and stubbed variable put back after each test, by the runner, not by the test.
    isolate: true,
    // The tests in each file run in a new order every time, so a test that leans on another fails at
    // once. The run prints its seed; `npm test -- --sequence.seed=<seed>` replays that order. Files
    // aren't shuffled: each has its own environment already, and the slowest starting first keeps
    // the run short.
    sequence: { shuffle: { files: false, tests: true } },
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
