import { describe, expect, it } from "vitest";
import { GO_LIVE_GUESS, ROUND_M } from "../constants/row-fold.constants";
import type { RowButton } from "../types/row-fold.types";
import { rowFold } from "./row-fold.util";

/** One of the bar's buttons, as wide as it's drawn. */
const button = (key: RowButton["key"]): RowButton => ({ key, width: key === "go-live" ? GO_LIVE_GUESS : ROUND_M });
/** The bar over someone else's stream while I'm not live: their sound, their voice, Go live. */
const watching = () => [button("sound"), button("voice"), button("go-live")];

describe("the bar over someone else's stream", () => {
  it("folds nothing on a picture wide enough, a tall one at 1920 × 1080 included", () => {
    expect(rowFold(470, { viewer: watching() }).folded).toEqual([]);
  });

  it("folds Go live first, into '…'", () => {
    expect(rowFold(190, { viewer: watching() }).folded).toEqual(["go-live"]);
  });

  it("then the stream's sound and the streamer's voice, together", () => {
    expect(rowFold(150, { viewer: watching() }).folded).toEqual(["go-live", "sound", "voice"]);
  });

  it("folds the settings before anything else", () => {
    expect(rowFold(100, { viewer: [button("settings")] }).folded).toEqual(["settings"]);
  });

  it("never folds my mic, however narrow the picture", () => {
    const fit = rowFold(60, { viewer: [button("sound"), button("voice"), button("mic")] });
    expect(fit.folded).toEqual(["sound", "voice"]);
  });

  it("never asks for the smaller size: the bar's buttons are M already", () => {
    expect(rowFold(130, { viewer: watching() }).size).toBe("l");
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
