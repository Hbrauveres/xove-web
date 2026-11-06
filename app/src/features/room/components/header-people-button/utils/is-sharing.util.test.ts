import { describe, expect, it } from "vitest";
import { isSharing } from "./is-sharing.util";

describe("whether someone shares", () => {
  it("is true for a screen or a camera, false for nothing", () => {
    expect(isSharing({ screen: true, camera: false })).toBe(true);
    expect(isSharing({ screen: false, camera: true })).toBe(true);
    expect(isSharing({ screen: false, camera: false })).toBe(false);
    expect(isSharing(undefined)).toBe(false);
  });
});
