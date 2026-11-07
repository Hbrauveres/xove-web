import { describe, expect, it } from "vitest";
import { blinks, drift, type Frame, type Seen } from "./frames.ts";

/** An element on a frame: shown at this opacity (0: gone), at this place. */
const seen = (opacity: number, x = 0): Seen => ({
  present: opacity > 0,
  visible: opacity > 0,
  opacity,
  box: { x, y: 0, w: 20, h: 20 },
});
/** A strip of frames, the icon's opacity on each. */
const strip = (...opacities: number[]): Frame[] => opacities.map((o, t) => ({ t: t * 16, seen: { icon: seen(o) } }));

describe("a blink", () => {
  it("is an element shown before and after that disappears in between", () => {
    expect(blinks(strip(1, 1, 0, 1, 1), "icon")).toEqual([2]);
  });

  it("is also a dip in its opacity, not only its disappearing", () => {
    expect(blinks(strip(1, 0.4, 1), "icon")).toEqual([1]);
  });

  it("isn't a steady element, nor a small wobble", () => {
    expect(blinks(strip(1, 1, 1), "icon")).toEqual([]);
    expect(blinks(strip(1, 0.9, 1), "icon")).toEqual([]);
  });

  it("isn't a fade out or a fade in: gone at one end", () => {
    expect(blinks(strip(1, 0.5, 0), "icon")).toEqual([]);
    expect(blinks(strip(0, 0.5, 1), "icon")).toEqual([]);
  });
});

describe("a move", () => {
  it("is how far an element went from where it started", () => {
    const frames: Frame[] = [0, 3, 4].map((x, t) => ({ t, seen: { icon: seen(1, x) } }));
    expect(drift(frames, "icon")).toBe(4);
  });

  it("is nothing for an element never seen", () => {
    expect(drift([{ t: 0, seen: {} }], "icon")).toBe(0);
  });
});
