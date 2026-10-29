import { describe, expect, it, vi } from "vitest";
import { lastRoom } from "../../test/fakeLiveKit";
import { connectedAdapter } from "../../test/factories/video-room.factory";
import type { Capture } from "./livekit.types";

describe("a capture before it's sent", () => {
  it("shows its preview and says when the browser ends it, without handing out its tracks", async () => {
    const adapter = await connectedAdapter();
    const capture = (await adapter.capture("camera", "smooth", "cam-2"))! as Capture;
    const ended = vi.fn();
    capture.onEnded(ended);

    expect(capture.preview).toBeDefined();
    expect(capture.hasSound).toBe(false);
    expect(lastRoom().localParticipant.createTracks).toHaveBeenLastCalledWith(
      expect.objectContaining({ video: expect.objectContaining({ deviceId: { ideal: "cam-2" } }) }),
    );
    expect(Object.keys(capture)).toEqual(["kind", "preview", "hasSound", "onEnded"]);
  });
});
