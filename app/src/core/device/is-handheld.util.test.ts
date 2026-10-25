import { describe, expect, it, vi } from "vitest";
import { HANDHELD_QUERY, isHandheld } from "./is-handheld.util";

/** A browser whose media queries answer `answers`, and nothing else. */
const browser = (answers: Record<string, boolean>) =>
  vi
    .spyOn(window, "matchMedia")
    .mockImplementation((q: string) => ({ matches: answers[q] ?? false, media: q }) as never);

describe("is this a phone or a tablet", () => {
  it("is, when the main pointer is a finger", () => {
    browser({ [HANDHELD_QUERY]: true });
    expect(isHandheld()).toBe(true);
  });

  it("isn't, for a computer, a touch-screen laptop or a narrow window: their main pointer is fine", () => {
    browser({ "(any-pointer: coarse)": true, "(max-width: 600px)": true });
    expect(isHandheld()).toBe(false);
  });
});
