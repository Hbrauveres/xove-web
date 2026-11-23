/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

/** In dev, /config.json as the container's Caddy serves it (Caddyfile), from the same variable. */
const appConfig = (): Plugin => ({
  name: "xove-app-config",
  configureServer(server) {
    server.middlewares.use("/config.json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(`{"streamPlaces": ${process.env.XOVE_STREAM_PLACES ?? "null"}}`);
    });
  },
});

/** From this many cores on, the tests use half of them. */
const MANY_CORES = 8;
const HALF = 2;

/**
 * How many test files run at once: on a big machine half its cores, so each worker keeps one to
 * itself and a heavy file isn't slowed by the others; on a small one (a 4-core CI runner) all but one,
 * where halving would only slow the run.
 */
function testWorkers(): number {
  const cores = availableParallelism();
  return cores >= MANY_CORES ? Math.floor(cores / HALF) : Math.max(1, cores - 1);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appConfig()],
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
    // Every test starts clean (docs/testing.md): each file in a fresh context with its own fake browser,
    // which the shared setup puts back after every test; and every spy, stubbed global and stubbed
    // variable put back by the runner, not by the test. A fresh context per file is far cheaper than a
    // new process for each.
    pool: "vmThreads",
    maxWorkers: testWorkers(),
    isolate: true,
    // The tests in each file run in a new order every time, so a test that leans on another fails at
    // once. The run prints its seed; `npm test -- --sequence.seed=<seed>` replays that order. Files
    // aren't shuffled: each has a fresh context already, and the slowest starting first keeps the run
    // short.
    sequence: { shuffle: { files: false, tests: true } },
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
