import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyStage } from "./EmptyStage";
import { StaticGlow } from "./StaticGlow";
import { STRENGTH } from "./staticBands";

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
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }) as never);
  return fills;
}

describe("the standby screen's light round the stage (spec 0136)", () => {
  it("is never brighter than the static looks on the screen", () => {
    const fills = setup();
    render(<StaticGlow prefs={{ on: true, brightness: 1 }} />);
    expect(fills.length).toBeGreaterThan(0);
    const brightest = Math.max(...fills.flatMap((f) => f.match(/\d+/g)!.map(Number)));
    expect(brightest).toBeLessThanOrEqual(Math.ceil(255 * 0.5 * STRENGTH));
  });

  it("follows the ambilight: switched off, there's no light and nothing is drawn", () => {
    const fills = setup();
    const { container } = render(<StaticGlow prefs={{ on: false, brightness: 1 }} />);
    expect(fills).toHaveLength(0);
    expect((container.firstChild as HTMLElement).style.opacity).toBe("0");
  });
});

describe("the TV turning on, once a visit (spec 0136)", () => {
  it("lights the stage and the wall the first time the stage stands by, and never again", () => {
    setup();
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as never);
    const first = render(
      <>
        <StaticGlow prefs={{ on: true, brightness: 1 }} />
        <EmptyStage />
      </>,
    );
    expect(first.container.querySelector('[class*="intro"]')).not.toBeNull();
    expect(first.container.querySelector('[class*="flash"]')).not.toBeNull();
    first.unmount();
    // The last stream stopped: the stage stands by again; the TV is already on.
    const again = render(
      <>
        <StaticGlow prefs={{ on: true, brightness: 1 }} />
        <EmptyStage />
      </>,
    );
    expect(again.container.querySelector('[class*="intro"]')).toBeNull();
    expect(again.container.querySelector('[class*="flash"]')).toBeNull();
  });

  it("doesn't turn on for anyone who asks for reduced motion", () => {
    setup();
    const { container } = render(<EmptyStage />);
    expect(container.querySelector('[class*="intro"]')).toBeNull();
  });
});
