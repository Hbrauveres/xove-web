import { describe, expect, it } from "vitest";
import { CAMERA_QUALITIES, SHARE_QUALITIES } from "@core/devices/devices.constants";
import {
  cameraCaptureOptions,
  cameraPublishOptions,
  capOf,
  contentHintOf,
  screenPublishOptions,
  viewerQualities,
} from "./shareSettings";
import type { StreamMode } from "@core/api/api.types";
import { STREAM_QUALITIES } from "@core/preferences/preferences.constants";

const modes: StreamMode[] = ["smooth", "sharp"];

describe("share presets", () => {
  it("has a preset for exactly the qualities each kind of stream may be sent at", () => {
    expect(SHARE_QUALITIES.map((q) => q.id)).toEqual(STREAM_QUALITIES.screen);
    expect(CAMERA_QUALITIES.map((q) => q.id)).toEqual(STREAM_QUALITIES.camera);
  });

  it("offers 1080p, 720p and 480p at 30 fps", () => {
    expect(SHARE_QUALITIES.map((q) => [q.id, q.height, q.fps])).toEqual([
      ["1080p", 1080, 30],
      ["720p", 720, 30],
      ["480p", 480, 30],
    ]);
  });

  it.each(modes)("%s: has its content hint", (mode) => {
    expect(contentHintOf(mode)).toBe(mode === "smooth" ? "motion" : "detail");
  });

  it.each(modes)("%s: VP9 with a VP8 fallback, always 1080p, 720p and 480p layers", (mode) => {
    const publish = screenPublishOptions(mode);

    expect(publish.videoCodec).toBe("vp9");
    expect(publish.backupCodec).toEqual({ codec: "vp8" });
    // VP9 as real layers (one stream per quality), so viewers get exactly 1080p, 720p or 480p.
    expect(publish.simulcast).toBe(true);
    expect(publish.scalabilityMode).toBe("L1T3");
    expect(publish.screenShareEncoding).toEqual({ maxBitrate: 8_000_000, maxFramerate: 30 });
    expect(
      publish.screenShareSimulcastLayers?.map((l) => [l.height, l.encoding.maxBitrate, l.encoding.maxFramerate]),
    ).toEqual([
      [720, 4_000_000, 30],
      [480, 2_000_000, 30],
    ]);
    expect(publish.degradationPreference).toBe(mode === "smooth" ? "maintain-framerate" : "maintain-resolution");
  });

  it("sets ceilings high enough that only the connection limits the picture", () => {
    // Well above LiveKit's own presets (1080p at 30 fps is 5 Mbit/s there).
    expect(SHARE_QUALITIES.map((q) => q.maxBitrate)).toEqual([8_000_000, 4_000_000, 2_000_000]);
  });

  it("turns the chosen quality into the highest layer sent", () => {
    expect([capOf("1080p"), capOf("720p"), capOf("480p")]).toEqual([2, 1, 0]);
  });
});

describe("screen sound", () => {
  it("is sent in stereo at music quality, without silence skipping", () => {
    const publish = screenPublishOptions("sharp");
    expect(publish.audioPreset).toEqual({ maxBitrate: 128_000 });
    expect(publish.forceStereo).toBe(true);
    expect(publish.dtx).toBe(false);
  });
});

describe("what a viewer can pick", () => {
  it("offers the sharer's quality and the ones below it, down to 480p", () => {
    expect(viewerQualities(1080)).toEqual(["1080p", "720p", "480p"]);
    expect(viewerQualities(720)).toEqual(["720p", "480p"]);
    expect(viewerQualities(480)).toEqual(["480p"]);
  });

  it("goes by the sharer's real height, which can be a bit smaller than the preset", () => {
    // A 16:10 or ultrawide screen captured into 1920x1080 comes out shorter.
    expect(viewerQualities(1012)).toEqual(["1080p", "720p", "480p"]);
    expect(viewerQualities(700)).toEqual(["720p", "480p"]);
    expect(viewerQualities(0)).toEqual(["480p"]);
  });

  it("never offers more than the sharer's chosen quality", () => {
    expect(viewerQualities(1080, 3, "720p")).toEqual(["720p", "480p"]);
    expect(viewerQualities(1080, 3, "480p")).toEqual(["480p"]);
    expect(viewerQualities(720, 3, "1080p")).toEqual(["720p", "480p"]);
  });

  it("offers only one quality when the sharer sends one layer", () => {
    expect(viewerQualities(1080, 1)).toEqual(["1080p"]);
  });
});

// Spec 0060: a camera goes up to 720p.
describe("camera presets", () => {
  it("offers 720p and 480p at 30 fps", () => {
    expect(CAMERA_QUALITIES.map((q) => [q.id, q.height, q.fps])).toEqual([
      ["720p", 720, 30],
      ["480p", 480, 30],
    ]);
  });

  it("asks the camera for 720p at 30 fps", () => {
    expect(cameraCaptureOptions().resolution).toEqual({ width: 1280, height: 720, frameRate: 30 });
    expect(cameraCaptureOptions().deviceId).toBeUndefined();
  });

  it("asks for the camera picked, falling back to another when it's gone", () => {
    // `ideal`, not `exact`: an unplugged camera doesn't stop the camera from starting.
    expect(cameraCaptureOptions("cam-2").deviceId).toEqual({ ideal: "cam-2" });
  });

  it.each(modes)("%s: VP9 with a VP8 fallback, a 720p and a 480p layer", (mode) => {
    const publish = cameraPublishOptions(mode);

    expect(publish.videoCodec).toBe("vp9");
    expect(publish.backupCodec).toEqual({ codec: "vp8" });
    expect(publish.simulcast).toBe(true);
    expect(publish.scalabilityMode).toBe("L1T3");
    expect(publish.videoEncoding).toEqual({ maxBitrate: 4_000_000, maxFramerate: 30 });
    expect(publish.videoSimulcastLayers?.map((l) => l.height)).toEqual([480]);
    expect(publish.degradationPreference).toBe(mode === "smooth" ? "maintain-framerate" : "maintain-resolution");
  });

  it("caps a camera at its own layers: 720p is the top one", () => {
    expect(capOf("720p")).toBe(1);
    expect(capOf("480p")).toBe(0);
  });
});
