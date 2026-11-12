import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { playingVideo, recordCanvases } from "../../../../../../testing/factories/canvas.factory";
import { fadeMask } from "../utils/fade-mask.util";
import { glowLayout } from "../utils/glow-layout.util";
import { useLightDrawing } from "./use-light-drawing.hook";

/** Each test's own light: its layout and mask. */
function light() {
  const layout = glowLayout(64, 36);
  return { layout, mask: fadeMask(layout) };
}

afterEach(() => vi.useRealTimers());

describe("drawing the light", () => {
  it("draws while lit with a video, and stops when it goes out", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const rec = recordCanvases();
    const { layout, mask } = light();
    const canvas = { current: document.createElement("canvas") };
    const video = playingVideo();
    const hook = renderHook(({ lit }) => useLightDrawing(canvas, { video, layout, mask, lit }), {
      initialProps: { lit: true },
    });
    vi.advanceTimersByTime(100);
    expect(rec.pictureDraws).toBeGreaterThan(0);
    hook.rerender({ lit: false });
    const before = rec.pictureDraws;
    vi.advanceTimersByTime(500);
    expect(rec.pictureDraws).toBe(before);
  });

  it("draws nothing without a video", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const rec = recordCanvases();
    const { layout, mask } = light();
    renderHook(() =>
      useLightDrawing({ current: document.createElement("canvas") }, { video: null, layout, mask, lit: true }),
    );
    vi.advanceTimersByTime(500);
    expect(rec.pictureDraws).toBe(0);
  });
});
