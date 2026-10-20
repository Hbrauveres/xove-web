import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StaticNoise } from "./StaticNoise";

const drawn = vi.fn();

beforeEach(() => {
  drawn.mockReset();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: drawn }) as never,
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 412, height: 232 } as DOMRect);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => vi.restoreAllMocks());

const reducedMotion = (on: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: on && q.includes("reduce"), addEventListener() {}, removeEventListener() {} }) as never);

describe("the standby screen's static (spec 0136)", () => {
  it("keeps drawing while it's on the screen", () => {
    reducedMotion(false);
    const frames = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    render(<StaticNoise />);
    expect(frames).toHaveBeenCalled();
  });

  it("is drawn once and stays still for anyone who asks for reduced motion", () => {
    reducedMotion(true);
    const frames = vi.spyOn(window, "requestAnimationFrame");
    render(<StaticNoise />);
    expect(drawn).toHaveBeenCalledTimes(1);
    expect(frames).not.toHaveBeenCalled();
  });

  it("draws a finer grain on a phone's stage than on a desktop's", () => {
    reducedMotion(true);
    const { container } = render(<StaticNoise />);
    // 412 px wide: 0.75 px a grain, 550 grains across (a desktop's 1.5 px would give 275).
    expect((container.querySelector("canvas") as HTMLCanvasElement).width).toBe(550);
  });
});
