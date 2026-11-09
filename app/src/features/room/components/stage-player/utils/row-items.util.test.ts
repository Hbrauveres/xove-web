import { describe, expect, it } from "vitest";
import { GO_LIVE_GUESS, ROUND_M, UNMUTE_WIDTH } from "../constants/row-fold.constants";
import type { RowShape } from "../types/row-fold.types";
import { rowItems } from "./row-items.util";

/** The row over someone else's stream, their sound and voice, while I'm not live. */
const watching = (): RowShape => ({
  mine: false,
  settingsOnly: false,
  sound: true,
  voice: true,
  live: false,
  held: false,
});

describe("the buttons on the picture", () => {
  it("over someone else's stream: their sound, their voice, then Go live as measured", () => {
    expect(rowItems(watching(), 96)).toEqual({
      viewer: [
        { key: "sound", width: ROUND_M },
        { key: "voice", width: ROUND_M },
        { key: "go-live", width: 96 },
      ],
    });
  });

  it("holds the unmute button in the sounds' place while the browser holds the sound back", () => {
    expect(rowItems({ ...watching(), held: true }, 96)).toEqual({
      viewer: [
        { key: "unmute", width: UNMUTE_WIDTH },
        { key: "go-live", width: 96 },
      ],
    });
  });

  it("guesses Go live's width before it's been measured", () => {
    const items = rowItems({ ...watching(), sound: false, voice: false }, null);
    expect(items).toEqual({ viewer: [{ key: "go-live", width: GO_LIVE_GUESS }] });
  });

  it("has my mic instead of Go live while I'm live", () => {
    expect(rowItems({ ...watching(), voice: false, live: true }, 96)).toEqual({
      viewer: [
        { key: "sound", width: ROUND_M },
        { key: "mic", width: ROUND_M },
      ],
    });
  });

  it("holds only the settings with nobody live, and my four buttons over my own stream", () => {
    expect(rowItems({ ...watching(), settingsOnly: true }, null)).toEqual({
      viewer: [{ key: "settings", width: ROUND_M }],
    });
    expect(rowItems({ ...watching(), mine: true }, null)).toEqual({ own: 4 });
  });
});
