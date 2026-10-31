import { expect, it, vi } from "vitest";
import { isKeyboardFocus } from "./keyboard-focus.util";

it("asks the element, and a browser that can't answer means no", () => {
  const el = document.createElement("button");
  const matches = vi.spyOn(el, "matches").mockReturnValue(true);
  expect(isKeyboardFocus(el)).toBe(true);
  matches.mockImplementation(() => {
    throw new Error("old browser");
  });
  expect(isKeyboardFocus(el)).toBe(false);
  expect(isKeyboardFocus(window)).toBe(false);
});
