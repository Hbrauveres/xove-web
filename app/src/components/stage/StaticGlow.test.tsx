import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STRENGTH } from "./staticBands";

const fills: string[] = [];

beforeEach(() => {
  fills.length = 0;
  vi.resetModules();
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
});
afterEach(() => vi.restoreAllMocks());

describe("the standby screen's light round the stage (spec 0136)", () => {
  it("is never brighter than the static looks on the screen", async () => {
    const { StaticGlow } = await import("./StaticGlow");
    render(<StaticGlow prefs={{ on: true, brightness: 1 }} />);
    expect(fills.length).toBeGreaterThan(0);
    const brightest = Math.max(...fills.flatMap((f) => f.match(/\d+/g)!.map(Number)));
    expect(brightest).toBeLessThanOrEqual(Math.ceil(255 * 0.5 * STRENGTH));
  });

  it("follows the ambilight: switched off, there's no light and nothing is drawn", async () => {
    const { StaticGlow } = await import("./StaticGlow");
    const { container } = render(<StaticGlow prefs={{ on: false, brightness: 1 }} />);
    expect(fills).toHaveLength(0);
    expect((container.firstChild as HTMLElement).style.opacity).toBe("0");
  });
});

describe("the TV turning on, once a visit (spec 0136)", () => {
  it("lights the stage and the wall the first time the stage stands by, and never again", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as never);
    const { EmptyStage } = await import("./EmptyStage");
    const { StaticGlow } = await import("./StaticGlow");
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

  it("doesn't turn on for anyone who asks for reduced motion", async () => {
    const { EmptyStage } = await import("./EmptyStage");
    const { container } = render(<EmptyStage />);
    expect(container.querySelector('[class*="intro"]')).toBeNull();
  });
});
