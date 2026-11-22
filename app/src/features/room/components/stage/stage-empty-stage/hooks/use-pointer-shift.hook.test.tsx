import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SHIFT_X, SHIFT_Y } from "../constants/pointer-shift.constants";
import { usePointerShift } from "./use-pointer-shift.hook";

function Stage() {
  const scene = useRef<HTMLDivElement>(null);
  const shift = usePointerShift(scene);
  return (
    <div data-testid="stage" {...shift}>
      <div data-testid="scene" ref={scene} />
    </div>
  );
}

const reduced = (matches: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches, media: q }) as MediaQueryList);

beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((run) => {
    run(0);
    return 1;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ x: 0, y: 0, width: 1000, height: 500 }),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("the scene's shift with the pointer", () => {
  it("moves the scene away from the pointer, and back when it leaves", () => {
    reduced(false);
    const { getByTestId } = render(<Stage />);
    fireEvent.pointerMove(getByTestId("stage"), { clientX: 0, clientY: 0 });
    expect(getByTestId("scene").style.transform).toBe(`translate3d(${SHIFT_X}px, ${SHIFT_Y}px, 0)`);
    fireEvent.pointerLeave(getByTestId("stage"));
    expect(getByTestId("scene").style.transform).toBe("translate3d(0px, 0px, 0)");
  });

  it("never moves it with reduced motion", () => {
    reduced(true);
    const { getByTestId } = render(<Stage />);
    fireEvent.pointerMove(getByTestId("stage"), { clientX: 0, clientY: 0 });
    expect(getByTestId("scene").style.transform).toBe("");
  });
});
