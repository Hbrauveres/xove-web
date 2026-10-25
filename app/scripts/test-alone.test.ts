import { describe, expect, it } from "vitest";
import { inParallel, patternFor, ranAsTargeted } from "./test-alone";

describe("running each test alone", () => {
  it("matches exactly the listed test, as Vitest names it, its brackets and marks taken literally", () => {
    const { pattern, cases } = patternFor("the toast's state > shows one message (spec 0133)? at a time");
    expect(cases).toBe(false);
    expect(new RegExp(pattern).test("the toast's state > shows one message (spec 0133)? at a time")).toBe(true);
    expect(new RegExp(pattern).test("the toast's state > shows one message (spec 0133)? at a time, twice")).toBe(false);
  });

  it("reads the quotes vitest list escapes, and lets an it.each's placeholder match each case", () => {
    expect(
      new RegExp(patternFor('timeAgo > says \\"just now\\" under 45 seconds').pattern).test(
        'timeAgo > says "just now" under 45 seconds',
      ),
    ).toBe(true);
    const each = patternFor("share presets > %s: has its content hint");
    expect(each.cases).toBe(true);
    expect(new RegExp(each.pattern).test("share presets > sharp: has its content hint")).toBe(true);
    expect(new RegExp(each.pattern).test("share presets > sharp: has its content hint, twice")).toBe(false);
  });

  it("counts a run only when what it targeted ran and passed", () => {
    const run = (summary: string) => ` RUN  v5\n\n      Tests  ${summary}\n   Duration  1s`;
    expect(ranAsTargeted(run("1 passed | 2 skipped (3)"), false)).toBe(true);
    expect(ranAsTargeted(run("3 skipped (3)"), false)).toBe(false);
    expect(ranAsTargeted(run("1 failed | 2 skipped (3)"), false)).toBe(false);
    expect(ranAsTargeted(run("2 passed | 1 skipped (3)"), false)).toBe(false);
    expect(ranAsTargeted(run("2 passed | 1 skipped (3)"), true)).toBe(true);
    expect(ranAsTargeted(run("1 passed | 1 failed (2)"), true)).toBe(false);
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
