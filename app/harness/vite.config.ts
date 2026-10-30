// The harness: the app on its test fakes, with every screen and state (`?s=`, `&page=`), for the device
// checks and the "looks the same" check. Tooling, never part of the app; it goes once every screen is in
// Storybook. The app's own settings, plus two stand-ins: LiveKit is the tests' fake, and `vi` is just enough
// of vitest's for those fakes to run in a browser.
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vite";
import app from "../vite.config.ts";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default mergeConfig(
  { ...app, test: undefined },
  defineConfig({
    root: here("."),
    resolve: { alias: { "livekit-client": here("livekit-client.ts"), vitest: here("vi.ts") } },
    css: { postcss: here("..") },
    server: { port: 5199, strictPort: true, fs: { allow: [here("..")] } },
    preview: { port: 5199, strictPort: true },
    build: { outDir: here("../harness-dist"), emptyOutDir: true },
  }),
);
