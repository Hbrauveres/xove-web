import { describe, expect, it } from "vitest";
import { inParallel, patternFor, ranExactlyOne } from "./test-alone";

describe("running each test alone", () => {
  it("matches exactly the listed test, as Vitest names it, its brackets and marks taken literally", () => {
    const pattern = new RegExp(patternFor("the toast's state > shows one message (spec 0133)? at a time"));
    expect(pattern.test("the toast's state > shows one message (spec 0133)? at a time")).toBe(true);
    expect(pattern.test("the toast's state > shows one message (spec 0133)? at a time, twice")).toBe(false);
  });

  it("counts a run only when exactly one test ran and passed", () => {
    expect(ranExactlyOne("      Tests  1 passed | 2 skipped (3)")).toBe(true);
    expect(ranExactlyOne("      Tests  3 skipped (3)")).toBe(false);
    expect(ranExactlyOne("      Tests  1 failed | 2 skipped (3)")).toBe(false);
    expect(ranExactlyOne("      Tests  2 passed | 1 skipped (3)")).toBe(false);
  });

  it("runs every job, never more than the limit at once, and names the ones that failed", async () => {
    let running = 0;
    let most = 0;
    const job = (label: string, fails = false) => ({
      label,
      go: async () => {
        most = Math.max(most, ++running);
        await Promise.resolve();
        running--;
        if (fails) throw new Error(label);
      },
    });
    const failed = await inParallel([job("a"), job("b", true), job("c"), job("d", true), job("e")], 2);
    expect(failed.sort()).toEqual(["b", "d"]);
    expect(most).toBeLessThanOrEqual(2);
  });
});
