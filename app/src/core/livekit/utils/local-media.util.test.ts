import type { LocalParticipant } from "livekit-client";
import { describe, expect, it } from "vitest";
import { cameraOn, connectedAdapter, shareScreen } from "../../../test/factories/video-room.factory";
import { lastRoom } from "../../../test/fakeLiveKit";
import { readLocalMedia } from "./local-media.util";

const me = () => lastRoom().localParticipant as unknown as LocalParticipant;

describe("reading what I send", () => {
  it("is nothing before I start", async () => {
    await connectedAdapter();
    expect(readLocalMedia(me(), undefined)).toMatchObject({
      publishing: { screen: false, camera: false },
      local: {},
      voice: false,
      cameraId: undefined,
    });
  });

  it("reads my screen and my camera, the camera's device, and keeps the mic input it's given", async () => {
    const adapter = await connectedAdapter();
    await shareScreen(adapter, false);
    await cameraOn(adapter);
    const mic = {} as MediaStreamTrack;

    const media = readLocalMedia(me(), mic);

    expect(media.publishing).toEqual({ screen: true, camera: true });
    expect(media.local.screen).toBeDefined();
    expect(media.cameraId).toBe("cam-1");
    expect(media.micInput).toBe(mic);
  });
});
