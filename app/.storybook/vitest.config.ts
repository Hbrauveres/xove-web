// Every story as a test, in a real browser: it must render without an error and pass the accessibility
// checks. Run with `npm run test:storybook`; `npm test` stays the fast jsdom suite.
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import app from "../vite.config.ts";

export default mergeConfig(
  { ...app, test: undefined },
  defineConfig({
    plugins: [storybookTest({ configDir: fileURLToPath(new URL(".", import.meta.url)) })],
    test: {
      name: "storybook",
      browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: "chromium" }] },
    },
  }),
);
