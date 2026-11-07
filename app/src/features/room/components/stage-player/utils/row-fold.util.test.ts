import { describe, expect, it } from "vitest";
import type { RowButton } from "../types/row-fold.types";
import { rowFold } from "./row-fold.util";

const sound: RowButton = { key: "sound", width: 34 };
const voice: RowButton = { key: "voice", width: 34 };
const goLive: RowButton = { key: "go-live", width: 92 };
const mic: RowButton = { key: "mic", width: 34 };

describe("the bar over someone else's stream", () => {
  it("folds nothing on a picture wide enough, a tall one at 1920 × 1080 included", () => {
    expect(rowFold(470, { viewer: [sound, voice, goLive] }).folded).toEqual([]);
  });

  it("folds Go live first, into '…'", () => {
    expect(rowFold(190, { viewer: [sound, voice, goLive] }).folded).toEqual(["go-live"]);
  });

  it("then the stream's sound and the streamer's voice, one at a time", () => {
    expect(rowFold(150, { viewer: [sound, voice, goLive] }).folded).toEqual(["go-live", "sound"]);
    expect(rowFold(130, { viewer: [sound, voice, goLive] }).folded).toEqual(["go-live", "sound", "voice"]);
  });

  it("folds the settings before anything else", () => {
    expect(rowFold(100, { viewer: [{ key: "settings", width: 34 }] }).folded).toEqual(["settings"]);
  });

  it("never folds my mic, however narrow the picture", () => {
    const fit = rowFold(100, { viewer: [sound, voice, mic] });
    expect(fit.folded).toEqual(["sound", "voice"]);
  });

  it("keeps the bar's buttons M", () => {
    expect(rowFold(130, { viewer: [sound, voice, goLive] }).size).toBe("m");
  });
});

describe("my own row", () => {
  it("is L and centred while it fits clear of the fullscreen button on both sides", () => {
    expect(rowFold(400, { own: 4 })).toEqual({ folded: [], size: "l", beside: false });
  });

  it("sits beside the fullscreen button when it can't be centred", () => {
    expect(rowFold(300, { own: 4 })).toEqual({ folded: [], size: "l", beside: true });
  });

  it("gets smaller, never folding, when L doesn't fit even beside it", () => {
    expect(rowFold(240, { own: 4 })).toEqual({ folded: [], size: "m", beside: true });
    expect(rowFold(225, { own: 3 })).toEqual({ folded: [], size: "m", beside: false });
  });

  it("stays beside the fullscreen button, never over it, when even M doesn't fit", () => {
    expect(rowFold(100, { own: 4 })).toEqual({ folded: [], size: "m", beside: true });
  });
});
