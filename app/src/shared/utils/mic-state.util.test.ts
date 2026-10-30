import { describe, expect, it } from "vitest";
import { micState } from "./mic-state.util";

describe("my mic's button", () => {
  it("while my voice is on, offers to mute it, with the mic", () => {
    expect(micState(true)).toEqual({ label: "Mute your voice", icon: "mic" });
  });

  it("while it's off, offers to share it, with the mic crossed", () => {
    expect(micState(false)).toEqual({ label: "Share your voice", icon: "mic-off" });
  });
});
