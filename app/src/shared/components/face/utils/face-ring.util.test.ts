import { describe, expect, it } from "vitest";
import { faceRing } from "./face-ring.util";

describe("a room face's ring", () => {
  it("is none while the person isn't live, talking or not", () => {
    expect(faceRing(false, "outside", true)).toEqual({ look: null, "data-ring": undefined, "data-talking": undefined });
  });

  it("is live around the face or inside its edge, and talking only when said", () => {
    expect(faceRing(true, "outside", false)).toEqual({
      look: "onAir",
      "data-ring": "outside",
      "data-talking": undefined,
    });
    expect(faceRing(true, "inside", true)).toEqual({
      look: "onAirInside",
      "data-ring": "inside",
      "data-talking": true,
    });
  });
});
