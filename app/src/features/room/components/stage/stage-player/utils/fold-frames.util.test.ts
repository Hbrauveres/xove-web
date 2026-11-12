import { expect, it } from "vitest";
import { foldFrames } from "./fold-frames.util";

it("moves and shrinks the box onto the corner button's, from its top-left corner", () => {
  const frames = foldFrames(new DOMRect(1000, 40, 400, 225), new DOMRect(1500, 12, 34, 34));
  expect(frames).toEqual([
    { transformOrigin: "0 0", transform: "none" },
    { transformOrigin: "0 0", transform: "translate(500px, -28px) scale(0.085, 0.1511111111111111)" },
  ]);
});
