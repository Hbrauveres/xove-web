import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStaticGlow } from "./use-static-glow.hook";

/** A stage 862 px tall, counting the rows the glow's canvas fills. */
function setup() {
  const fills = vi.fn();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ width: 1532, height: 862 }),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: fills } as never);
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
  return fills;
}

function Glow({ on }: { on: boolean }) {
  const { canvas, stage } = useStaticGlow(on);
  return (
    <span ref={stage}>
      <canvas ref={canvas} />
    </span>
  );
}

describe("keeping the static's light drawn", () => {
  it("draws a row per 24 px of the stage while on", () => {
    const fills = setup();
    const { container } = render(<Glow on />);
    const rows = Math.ceil(862 / 24);
    expect((container.querySelector("canvas") as HTMLCanvasElement).height).toBe(rows);
    expect(fills).toHaveBeenCalledTimes(rows);
  });

  it("draws nothing while off", () => {
    const fills = setup();
    render(<Glow on={false} />);
    expect(fills).not.toHaveBeenCalled();
  });
});
