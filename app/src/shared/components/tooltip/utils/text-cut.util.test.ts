import { expect, it } from "vitest";
import { textCut } from "./text-cut.util";

/** An element whose text needs `needs` px and has `has`. */
const box = (has: number, needs: number) => {
  const el = document.createElement("span");
  Object.defineProperty(el, "clientWidth", { value: has });
  Object.defineProperty(el, "scrollWidth", { value: needs });
  return el;
};

it("is cut when it, or something in it, has less room than its text needs", () => {
  const button = box(200, 200);
  expect(textCut(button)).toBe(false);
  button.append(box(160, 160));
  expect(textCut(button)).toBe(false);
  button.append(box(160, 231));
  expect(textCut(button)).toBe(true);
  expect(textCut(null)).toBe(false);
});
