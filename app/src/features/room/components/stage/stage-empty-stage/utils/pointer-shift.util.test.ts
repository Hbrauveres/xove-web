import { describe, expect, it } from "vitest";
import { SHIFT_X, SHIFT_Y } from "../constants/pointer-shift.constants";
import { pointerShift } from "./pointer-shift.util";

const box = { left: 100, top: 50, width: 800, height: 400 };

describe("the scene's shift with the pointer", () => {
  it("doesn't move with the pointer in the middle", () => {
    expect(pointerShift(500, 250, box)).toEqual({ x: 0, y: 0 });
  });

  it("moves away from the pointer, the most at the stage's edges", () => {
    expect(pointerShift(100, 50, box)).toEqual({ x: SHIFT_X, y: SHIFT_Y });
    expect(pointerShift(900, 450, box)).toEqual({ x: -SHIFT_X, y: -SHIFT_Y });
  });

  it("stays put while the stage has no size yet", () => {
    expect(pointerShift(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  });
});
