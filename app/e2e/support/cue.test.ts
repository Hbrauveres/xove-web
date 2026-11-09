import { describe, expect, it } from "vitest";
import { cueAgainstSound, type CueFrame } from "./cue.ts";

/** Frames every 16 ms from 0 to 3000 ms, the voice sounding from 500 to 1500 ms, lit where `lit(t)` says. */
const frames = (lit: (t: number) => boolean): CueFrame[] =>
  Array.from({ length: 188 }, (_, i) => ({ at: i * 16, on: lit(i * 16), sound: i * 16 >= 500 && i * 16 < 1500 }));

describe("the speaking cue against the sound", () => {
  it("passes a cue lit at once and out after the hold", () => {
    expect(cueAgainstSound(frames((t) => t >= 512 && t < 1750))).toEqual([]);
  });

  it("names a late cue, a gap while the sound plays, and one that goes out too soon or never", () => {
    expect(cueAgainstSound(frames((t) => t >= 800 && t < 1750))[0]).toMatch(/lit 288 ms after/);
    expect(cueAgainstSound(frames((t) => t >= 512 && t < 1750 && (t < 900 || t > 1300)))[0]).toMatch(
      /out at 912 while it played/,
    );
    expect(cueAgainstSound(frames((t) => t >= 512 && t < 1520))[0]).toMatch(/out 16 ms after/);
    expect(cueAgainstSound(frames((t) => t >= 512))[0]).toMatch(/out never ms after/);
  });

  it("lets a silence shorter than the hold keep it lit (between words)", () => {
    const words = (t: number) => (t >= 500 && t < 1000) || (t >= 1200 && t < 1500);
    const between: CueFrame[] = Array.from({ length: 188 }, (_, i) => ({
      at: i * 16,
      on: i * 16 >= 512 && i * 16 < 1750,
      sound: words(i * 16),
    }));
    expect(cueAgainstSound(between)).toEqual([]);
  });

  it("lets the page's audio drop out for a moment while the sound plays", () => {
    expect(cueAgainstSound(frames((t) => t >= 512 && t < 1750 && (t < 900 || t > 1000)))).toEqual([]);
  });
});
