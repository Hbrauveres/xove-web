import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STRENGTH } from "../../../constants/static-bands.constants";
import { StageStaticGlow } from "./stage-static-glow.component";
/** Each test's own stage: a canvas recording what it fills, the stage's size, and reduced motion
 * answered for the reduced-motion test. Returns what was filled, in order. */
function setup() {
  const fills: string[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
    const ctx = {
      fillStyle: "",
      fillRect: () => fills.push(ctx.fillStyle),
      // The static's own canvas, for the tests that show the stage too.
      createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => {},
    };
    return ctx as never;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 1532, height: 862 } as DOMRect);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }) as never,
  );
  return fills;
}

describe("the standby screen's light round the stage", () => {
  it("is never brighter than the static looks on the screen", () => {
    const fills = setup();
    render(<StageStaticGlow prefs={{ on: true, brightness: 1 }} turnOn={false} />);
    expect(fills.length).toBeGreaterThan(0);
    const brightest = Math.max(...fills.flatMap((f) => (f.match(/\d+/g) ?? []).map(Number)));
    expect(brightest).toBeLessThanOrEqual(Math.ceil(255 * 0.5 * STRENGTH));
  });

  it("follows the ambilight: switched off, there's no light and nothing is drawn", () => {
    const fills = setup();
    const { container } = render(<StageStaticGlow prefs={{ on: false, brightness: 1 }} turnOn={false} />);
    expect(fills).toHaveLength(0);
    expect((container.firstChild as HTMLElement).style.opacity).toBe("0");
  });
});

describe("the TV turning on", () => {
  it("flashes the wall when the stage asks for it, and not otherwise", () => {
    setup();
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q }) as MediaQueryList);
    const first = render(<StageStaticGlow prefs={{ on: true, brightness: 1 }} turnOn />);
    expect(first.container.querySelector("i")).not.toBeNull();
    first.unmount();
    const again = render(<StageStaticGlow prefs={{ on: true, brightness: 1 }} turnOn={false} />);
    expect(again.container.querySelector("i")).toBeNull();
  });

  it("doesn't flash for anyone who asks for reduced motion", () => {
    setup();
    const { container } = render(<StageStaticGlow prefs={{ on: true, brightness: 1 }} turnOn />);
    expect(container.querySelector("i")).toBeNull();
  });
});
