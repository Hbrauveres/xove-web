import { describe, expect, it } from "vitest";
import { aSharer } from "../../../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../../../testing/factories/stream-controls.factory";
import { rowShape } from "./row-shape.util";

describe("what the row on the picture holds", () => {
  it("over someone else's stream: their sound and voice, and Go live while I'm not live", () => {
    expect(rowShape(aSharer(), aStreamControls())).toEqual({
      mine: false,
      settingsOnly: false,
      sound: true,
      voice: true,
      live: false,
      held: false,
    });
  });

  it("the unmute pill while the browser holds the sound, over someone else's stream only", () => {
    const held = aStreamControls({ soundHeld: true });
    expect(rowShape(aSharer(), held).held).toBe(true);
    expect(rowShape(aSharer({ isMe: true }), held).held).toBe(false);
    expect(rowShape(null, held).held).toBe(false);
  });

  it("my mic instead of Go live while I'm live", () => {
    const controls = aStreamControls({ mine: { screen: false, camera: true } });
    expect(rowShape(aSharer(), controls).live).toBe(true);
  });

  it("my own row over my stream, and only the settings with nobody live", () => {
    expect(rowShape(aSharer({ isMe: true }), aStreamControls()).mine).toBe(true);
    expect(rowShape(null, aStreamControls()).settingsOnly).toBe(true);
  });
});
