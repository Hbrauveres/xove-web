import { expect, it } from "vitest";
import { frameTransforms } from "./frame-transforms.util";
import { wordMark } from "./mark.util";

it("at rest, nothing moves and the dot is round", () => {
  const mark = wordMark();
  const t = frameTransforms(mark, { slide: 0, settle: 0, eye: { sx: 1, sy: 1 } });
  expect(t.letters).toBe("translate(0,0)");
  expect(Object.values(t.corners)).toEqual(Array(4).fill("translate(0,0)"));
  expect(t.dot).toBeNull();
});

it("closed, the left corners stay sideways while the letters and the right corners move", () => {
  const mark = wordMark();
  const t = frameTransforms(mark, { slide: 1, settle: 0, eye: { sx: 1, sy: 0.5 } });
  expect(t.corners["top-left"]).toBe("translate(0,0)");
  expect(t.corners["top-right"]).toMatch(/^translate\(-/);
  expect(t.letters).toMatch(/^translate\(-/);
  expect(t.dot).toContain("scale(1,0.5)");
});
