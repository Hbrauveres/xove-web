import { describe, expect, it, vi } from "vitest";
import { staticPicture } from "./static-picture.util";

/** A canvas context that keeps the picture it's handed. */
function context() {
  const put = vi.fn();
  const ctx = {
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: put,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, put };
}

describe("the static's picture", () => {
  it("draws nothing before it's sized", () => {
    const { ctx, put } = context();
    staticPicture(ctx).draw(0);
    expect(put).not.toHaveBeenCalled();
  });

  it("paints opaque grey snow, a new pattern each frame", () => {
    const { ctx, put } = context();
    const picture = staticPicture(ctx);
    picture.fit(40, 20);
    picture.draw(0);
    const first = Array.from(put.mock.calls[0]?.[0].data as Uint8ClampedArray);
    picture.draw(50);
    const second = Array.from(put.mock.calls[1]?.[0].data as Uint8ClampedArray);
    // Every pixel opaque and grey (red, green and blue alike).
    for (let i = 0; i < first.length; i += 4) {
      expect(first[i + 3]).toBe(255);
      expect(first[i]).toBe(first[i + 1]);
      expect(first[i + 1]).toBe(first[i + 2]);
    }
    expect(second).not.toEqual(first);
  });
});
