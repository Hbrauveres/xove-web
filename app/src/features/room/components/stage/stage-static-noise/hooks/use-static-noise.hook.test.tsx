import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStaticNoise } from "./use-static-noise.hook";

function Noise() {
  return <canvas ref={useStaticNoise()} />;
}

describe("keeping the static drawn", () => {
  it("sizes the canvas in grains to its box, and draws it once, still, for reduced motion", () => {
    const put = vi.fn();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({ width: 1532, height: 862 }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: put,
    } as never);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) => ({ matches: q.includes("reduce") }) as MediaQueryList,
    );
    const { container } = render(<Noise />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect([canvas.width, canvas.height]).toEqual([Math.ceil(1532 / 1.5), Math.ceil(862 / 1.5)]);
    expect(put).toHaveBeenCalledTimes(1);
  });
});
