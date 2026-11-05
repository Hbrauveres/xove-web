import { expect, it } from "vitest";
import { boxAttrs, cornerAttrs, dotAttrs, strokeAttrs, wipeAttrs } from "./mark-attrs.util";
import { wordMark } from "./mark.util";

it("paints the corners in the text colour, the top right one red", () => {
  const mark = wordMark();
  const painted = mark.corners.map(cornerAttrs);
  expect(painted.filter((c) => c["data-red"]).map((c) => c["data-corner"])).toEqual(["top-right"]);
  expect(painted.find((c) => c["data-red"])?.stroke).toBe("var(--accent)");
  expect(painted.find((c) => !c["data-red"])?.stroke).toBe("currentColor");
});

it("draws a letter's stroke square-ended in the text colour", () => {
  const mark = wordMark();
  const first = mark.letters[0]?.strokes[0];
  expect(first && strokeAttrs(first)).toMatchObject({ strokeLinecap: "butt", stroke: "currentColor" });
});

it("sizes the drawing by its height, its width following its box", () => {
  const mark = wordMark();
  const attrs = boxAttrs(mark.viewBox, 26);
  expect(attrs.height).toBe(26);
  expect(attrs.width).toBeCloseTo((26 * mark.viewBox.width) / mark.viewBox.height);
  expect(dotAttrs(mark.dot).fill).toBe("var(--accent)");
  expect(wipeAttrs(mark.frame).width).toBe(mark.frame.right - mark.frame.left);
});
