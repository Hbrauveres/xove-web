// The end-to-end tests: one per feature case, at every size. The harness (the app on its test fakes)
// serves the app; E2E_BASE_URL points them at another copy instead (a reference version, run beside),
// and E2E_OUT says where each case's records go (docs/testing.md).
import { defineConfig } from "@playwright/test";
import { PHONE_TAG, SIZES } from "./support/sizes.ts";

const base = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.e2e.ts",
  // Every case records its own files; a case runs alone, so they run side by side.
  fullyParallel: true,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 10,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["json", { outputFile: `${process.env.E2E_OUT ?? "test-results"}/results.json` }]],
  outputDir: `${process.env.E2E_OUT ?? "test-results"}/playwright`,
  use: {
    baseURL: base ?? "http://localhost:5199",
    browserName: "chromium",
    // The app follows the system's reduced motion; the tests see the motion people see by default.
    reducedMotion: "no-preference",
  },
  projects: SIZES.map((s) => ({
    name: s.name,
    use: {
      viewport: { width: s.width, height: s.height },
      deviceScaleFactor: s.scale,
      isMobile: s.phone,
      hasTouch: s.phone,
    },
    ...(s.phone ? { grep: new RegExp(PHONE_TAG) } : { grepInvert: new RegExp(PHONE_TAG) }),
  })),
  ...(base
    ? {}
    : {
        webServer: {
          command: "npm run harness",
          url: "http://localhost:5199",
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});
