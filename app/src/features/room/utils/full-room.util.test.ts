import { describe, expect, it } from "vitest";
import { fullRoom } from "./full-room.util";

describe("fullRoom", () => {
  it("says how many streams the room holds", () => {
    expect(fullRoom(4)).toBe("4 streams are live, the most at once. You can start yours when one stops.");
    expect(fullRoom(1)).toMatch(/^1 stream is live/);
  });
});
