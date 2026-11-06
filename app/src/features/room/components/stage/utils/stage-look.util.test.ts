import { describe, expect, it } from "vitest";
import { shapeStyle } from "./stage-look.util";

describe("the stage's box", () => {
  it("is drawn in the picture's shape", () => {
    expect(shapeStyle(1.84)).toEqual({ "--shape": 1.84 });
  });
});
