import { vi } from "vitest";

/** What a light asked of its canvases: how often it drew a video, blurred, cut, and whether it read pixels. */
export interface CanvasRecord {
  pictureDraws: number;
  pixelReads: number;
  blurs: string[];
  composites: string[];
  masks: number;
  alphas: number[];
}

/**
 * jsdom has no canvas: every canvas gets a 2D context that records what it's asked, in the
 * returned record. `getImageData` (reading pixels) is counted, so a test can say it never happens.
 */
export function recordCanvases(): CanvasRecord {
  const rec: CanvasRecord = { pictureDraws: 0, pixelReads: 0, blurs: [], composites: [], masks: 0, alphas: [] };
  const context = (canvas: HTMLCanvasElement) => {
    let alpha = 1;
    let filter = "none";
    return {
      canvas,
      set globalAlpha(a: number) {
        alpha = a;
        rec.alphas.push(a);
      },
      get globalAlpha() {
        return alpha;
      },
      set filter(f: string) {
        filter = f;
        if (f.startsWith("blur")) rec.blurs.push(f);
      },
      get filter() {
        return filter;
      },
      set globalCompositeOperation(op: string) {
        rec.composites.push(op);
      },
      clearRect: () => undefined,
      drawImage: (source: unknown) => {
        if (source instanceof HTMLVideoElement) rec.pictureDraws++;
      },
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => {
        rec.masks++;
      },
      getImageData: () => {
        rec.pixelReads++;
        return { data: new Uint8ClampedArray(4) };
      },
    };
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    return context(this) as never;
  });
  return rec;
}

/** A video that plays (or is paused) with a 1920×1080 picture ready to draw. */
export function playingVideo(playing = true): HTMLVideoElement {
  const video = document.createElement("video");
  Object.defineProperty(video, "paused", { configurable: true, get: () => !playing });
  Object.defineProperty(video, "readyState", { configurable: true, get: () => 4 });
  Object.defineProperty(video, "videoWidth", { configurable: true, get: () => 1920 });
  Object.defineProperty(video, "videoHeight", { configurable: true, get: () => 1080 });
  return video;
}
