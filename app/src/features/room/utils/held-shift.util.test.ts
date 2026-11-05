import { expect, it } from "vitest";
import { heldShift } from "./held-shift.util";

it("moves the row by however far the button under the pointer was pushed", () => {
  expect(heldShift(0, 400, 409)).toBe(-9);
  expect(heldShift(-9, 400, 391)).toBe(0);
  expect(heldShift(12, 300, 300)).toBe(12);
});
