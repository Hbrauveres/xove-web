import { describe, expect, it } from "vitest";
import { playingVideo, recordCanvases } from "../../../../../../testing/factories/canvas.factory";
import { EASE_MS, SLOW_EASE } from "../constants/stage-light.constants";
import { easeFor } from "./ease.util";
import { fadeMask } from "./fade-mask.util";
import { glowLayout } from "./glow-layout.util";
import { lightPainter } from "./light-painter.util";

/** Each test's own light: its layout and mask. */
function light() {
  const layout = glowLayout(64, 36);
  return { layout, mask: fadeMask(layout) };
}
const out = () => document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;

describe("painting the light once", () => {
  it("draws the picture's nine pieces, blurs once and cuts with the mask made once, never reading pixels", () => {
    const rec = recordCanvases();
    const { layout, mask } = light();
    const paint = lightPainter(out(), playingVideo(), layout, { mask, slow: false });
    paint?.(0);
    paint?.(16);
    expect(rec.pictureDraws).toBe(18);
    expect(rec.blurs).toEqual(["blur(6px)", "blur(6px)"]);
    expect(rec.masks).toBe(1);
    expect(rec.composites).toContain("destination-in");
    expect(rec.pixelReads).toBe(0);
  });

  it("jumps to the picture first, then eases by the time between updates, or a fixed step when slow", () => {
    const rec = recordCanvases();
    const { layout, mask } = light();
    const paint = lightPainter(out(), playingVideo(), layout, { mask, slow: false });
    paint?.(100);
    paint?.(150);
    expect(rec.alphas).toEqual([1, easeFor(50, EASE_MS)]);
    const slowRec = recordCanvases();
    const slow = lightPainter(out(), playingVideo(), layout, { mask, slow: true });
    slow?.(0);
    slow?.(500);
    expect(slowRec.alphas).toEqual([1, SLOW_EASE]);
  });

  it("draws nothing while paused or before the picture has a size", () => {
    const rec = recordCanvases();
    const { layout, mask } = light();
    lightPainter(out(), playingVideo(false), layout, { mask, slow: false })?.(0);
    const empty = playingVideo();
    Object.defineProperty(empty, "videoWidth", { configurable: true, get: () => 0 });
    lightPainter(out(), empty, layout, { mask, slow: false })?.(0);
    expect(rec.pictureDraws).toBe(0);
  });
});
