import { afterEach, expect, it, vi } from "vitest";
import { reducedMotion } from "./reduced-motion.util";

afterEach(() => vi.unstubAllGlobals());

it("follows the browser's setting, and is off where the browser can't say", () => {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce") }));
  expect(reducedMotion()).toBe(true);
  vi.stubGlobal("matchMedia", undefined);
  expect(reducedMotion()).toBe(false);
});
