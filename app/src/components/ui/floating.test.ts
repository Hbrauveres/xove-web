import { afterEach, describe, expect, it, vi } from "vitest";
import { claimFloating, dismissFloating, insideFloating, releaseFloating, resetFloating } from "./floating";

afterEach(() => resetFloating());

describe("one floating piece at a time (spec 0133)", () => {
  it("closes what floats when another appears", () => {
    const first = vi.fn();
    claimFloating(first);
    claimFloating(vi.fn());
    expect(first).toHaveBeenCalledOnce();
  });

  it("closes nothing once the piece went away on its own", () => {
    const close = vi.fn();
    claimFloating(close);
    releaseFloating(close);
    dismissFloating();
    expect(close).not.toHaveBeenCalled();
  });

  it("knows what shows inside the floating piece's area", () => {
    const area = document.createElement("div");
    const inner = area.appendChild(document.createElement("button"));
    claimFloating(vi.fn(), area);
    expect(insideFloating(inner)).toBe(true);
    expect(insideFloating(document.body)).toBe(false);
  });

  it("resets to nothing floating, without closing what was there", () => {
    const close = vi.fn();
    claimFloating(close);
    resetFloating();
    claimFloating(vi.fn());
    expect(close).not.toHaveBeenCalled();
  });
});
