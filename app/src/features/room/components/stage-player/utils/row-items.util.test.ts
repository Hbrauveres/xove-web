import { describe, expect, it } from "vitest";
import { GO_LIVE_GUESS } from "../constants/row-fold.constants";
import type { RowShape } from "../types/row-fold.types";
import { rowItems } from "./row-items.util";

const watching: RowShape = { mine: false, settingsOnly: false, sound: true, voice: true, live: false };

describe("the buttons on the picture", () => {
  it("over someone else's stream: their sound, their voice, then Go live as measured", () => {
    expect(rowItems(watching, 96)).toEqual({
      viewer: [
        { key: "sound", width: 34 },
        { key: "voice", width: 34 },
        { key: "go-live", width: 96 },
      ],
    });
  });

  it("guesses Go live's width before it's been measured", () => {
    const items = rowItems({ ...watching, sound: false, voice: false }, null);
    expect(items).toEqual({ viewer: [{ key: "go-live", width: GO_LIVE_GUESS }] });
  });

  it("has my mic instead of Go live while I'm live", () => {
    expect(rowItems({ ...watching, voice: false, live: true }, 96)).toEqual({
      viewer: [
        { key: "sound", width: 34 },
        { key: "mic", width: 34 },
      ],
    });
  });

  it("holds only the settings with nobody live, and my four buttons over my own stream", () => {
    expect(rowItems({ ...watching, settingsOnly: true }, null)).toEqual({ viewer: [{ key: "settings", width: 34 }] });
    expect(rowItems({ ...watching, mine: true }, null)).toEqual({ own: 4 });
  });
});
