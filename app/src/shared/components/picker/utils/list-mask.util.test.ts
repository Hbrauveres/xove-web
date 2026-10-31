import { expect, it } from "vitest";
import { isUnderList, listMask } from "./list-mask.util";

const box = (top: number, height: number) => new DOMRect(0, top, 100, height);

it("finds what's under the list and its fade, not what's further down", () => {
  const list = box(100, 100);
  expect(isUnderList(box(150, 20), list)).toBe(true);
  expect(isUnderList(box(220, 20), list)).toBe(true);
  expect(isUnderList(box(300, 20), list)).toBe(false);
});

it("masks from the list's top to under it, then fades back in", () => {
  expect(listMask(box(50, 300), box(100, 100))).toBe(
    "linear-gradient(to bottom, #000 50px, transparent 50px, transparent 154px, " +
      "rgba(0, 0, 0, 0.08) 169px, rgba(0, 0, 0, 0.35) 176.5px, #000 184px)",
  );
});
