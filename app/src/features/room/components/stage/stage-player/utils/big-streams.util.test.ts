import { describe, expect, it } from "vitest";
import type { LiveFeed, Sharer } from "../../../../types/room-view.types";
import { bigStreams } from "./big-streams.util";

const feed = (kind: "screen" | "camera"): LiveFeed => ({ kind, startedAt: 0, settings: {} as LiveFeed["settings"] });
const sharer = (screen?: LiveFeed, camera?: LiveFeed): Sharer => ({
  person: { id: "b", name: "Bruno", hue: 30, online: true },
  isMe: false,
  since: 0,
  ...(screen ? { screen } : {}),
  ...(camera ? { camera } : {}),
});

describe("what plays big", () => {
  it("is the screen, with the camera in the facecam, or the other way when swapped", () => {
    const screen = feed("screen");
    const camera = feed("camera");
    expect(bigStreams(sharer(screen, camera), false)).toEqual({ main: screen, small: camera });
    expect(bigStreams(sharer(screen, camera), true)).toEqual({ main: camera, small: screen });
  });

  it("is the one stream alone, with no facecam, swapped or not", () => {
    const camera = feed("camera");
    expect(bigStreams(sharer(undefined, camera), true)).toEqual({ main: camera, small: undefined });
  });

  it("is nothing with nobody on the stage", () => {
    expect(bigStreams(null, false)).toEqual({ main: null, small: undefined });
  });
});
