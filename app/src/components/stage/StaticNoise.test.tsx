import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StaticNoise } from "./StaticNoise";

/** Each test's own stage and canvas; returns what the canvas was handed to draw. */
function setup() {
  const drawn = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: drawn }) as never,
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 412, height: 232 } as DOMRect);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  return drawn;
}

const reducedMotion = (on: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} }) as never);

describe("the standby screen's static (spec 0136)", () => {
  it("keeps drawing while it's on the screen", () => {
    setup();
    reducedMotion(false);
    const frames = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    render(<StaticNoise />);
    expect(frames).toHaveBeenCalled();
  });

  it("is drawn once and stays still for anyone who asks for reduced motion", () => {
    const drawn = setup();
    reducedMotion(true);
    const frames = vi.spyOn(window, "requestAnimationFrame");
    render(<StaticNoise />);
    expect(drawn).toHaveBeenCalledTimes(1);
    expect(frames).not.toHaveBeenCalled();
  });

  it("draws again when the stage is sized, so a still static never goes blank", () => {
    const drawn = setup();
    reducedMotion(true);
    // Sizing a canvas clears it; the browser reports the size once just after it's watched, and on
    // every resize after.
    let resized = () => {};
    vi.stubGlobal("ResizeObserver", class { constructor(cb: () => void) { resized = cb; } observe() {} disconnect() {} });
    render(<StaticNoise />);
    expect(drawn).toHaveBeenCalledTimes(1);
    resized();
    expect(drawn).toHaveBeenCalledTimes(2);
    resized();
    expect(drawn).toHaveBeenCalledTimes(3);
  });

  it("keeps a wide stage's grain coarser, so a 4K screen costs what a desktop does", () => {
    setup();
    reducedMotion(true);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 3200, height: 1800 } as DOMRect);
    const { container } = render(<StaticNoise />);
    expect((container.querySelector("canvas") as HTMLCanvasElement).width).toBeLessThanOrEqual(1066);
  });

  it("draws a finer grain on a phone's stage than on a desktop's", () => {
    setup();
    reducedMotion(true);
    const { container } = render(<StaticNoise />);
    // 412 px wide: 0.75 px a grain, 550 grains across (a desktop's 1.5 px would give 275).
    expect((container.querySelector("canvas") as HTMLCanvasElement).width).toBe(550);
  });
});
