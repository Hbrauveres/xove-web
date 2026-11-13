import { describe, expect, it, vi } from "vitest";
import type { SettingsSession } from "../../../../types/settings.types";
import { cueIn, settingsStreamOf, settingsTabItems } from "./settings-tab-items.util";

const session = (over: Partial<SettingsSession> = {}): SettingsSession => ({
  open: true,
  onClose: () => {},
  screenTab: true,
  mine: { screen: false, camera: true },
  prefs: { screen: { quality: "1080p", mode: "smooth" }, camera: { quality: "720p", mode: "sharp" } },
  onPrefsChange: vi.fn(),
  onChangeWindow: () => {},
  cameras: [],
  cameraId: null,
  onPickCamera: () => {},
  onPreviewCamera: () => {},
  ...over,
});

describe("the settings' tabs", () => {
  it("mark what I send live: my streams, and my voice", () => {
    const items = settingsTabItems(session({ voice: true }), ["screen", "camera", "voice"]);
    expect(items.map((t) => [t.key, t.live])).toEqual([
      ["screen", false],
      ["camera", true],
      ["voice", true],
    ]);
  });

  it("can't use Screen where a screen can't be shared, and say why", () => {
    const items = settingsTabItems(session({ screenTab: false }), ["camera", "voice"]);
    expect(items[0]?.unavailable?.reason).toBe("This browser can't share a screen");
    expect(items[1]?.unavailable).toBeUndefined();
  });

  it("hand a stream's tab its own quality and mode, its changes going to that stream", () => {
    const s = session();
    const camera = settingsStreamOf(s, "camera");
    expect(camera.prefs).toEqual({ quality: "720p", mode: "sharp" });
    camera.onChange({ quality: "480p", mode: "sharp" });
    expect(s.onPrefsChange).toHaveBeenCalledWith("camera", { quality: "480p", mode: "sharp" });
  });

  it("cue a control only in the tab the cue is for", () => {
    expect(cueIn({ kind: "camera", n: 3 }, "camera")).toBe(3);
    expect(cueIn({ kind: "camera", n: 3 }, "screen")).toBeUndefined();
    expect(cueIn(null, "camera")).toBeUndefined();
  });
});
