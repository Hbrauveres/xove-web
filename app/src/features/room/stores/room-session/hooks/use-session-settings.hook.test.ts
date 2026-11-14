import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SessionCore, SettingsOpen } from "../types/room-session.types";
import { useSessionSettings } from "./use-session-settings.hook";

/** My camera as sent and as previewed, the settings open on Camera, its actions as spies. */
function setup(camera: boolean) {
  const sent = { attach: vi.fn(), detach: vi.fn() };
  const preview = { attach: vi.fn(), detach: vi.fn() };
  const settings: SettingsOpen = {
    open: true,
    toggle: vi.fn(),
    close: vi.fn(),
    goTo: { kind: "camera", n: 1 },
    goToSetting: vi.fn(),
    cue: { kind: "camera", n: 1 },
    endCue: vi.fn(),
  };
  const core = {
    mine: { screen: false, camera },
    cameraPreview: preview,
    video: { local: { camera: sent }, voice: false },
  } as unknown as SessionCore;
  return { sent, preview, settings, core };
}

describe("the settings panel's part of the session", () => {
  it("shows the camera being sent while it's live, and the preview's otherwise", () => {
    const live = setup(true);
    const off = setup(false);
    expect(renderHook(() => useSessionSettings(live.core, live.settings)).result.current.cameraVideo).toBe(live.sent);
    expect(renderHook(() => useSessionSettings(off.core, off.settings)).result.current.cameraVideo).toBe(off.preview);
  });

  it("gives the same value while nothing changes", () => {
    const { core, settings } = setup(false);
    const { result, rerender } = renderHook(() => useSessionSettings(core, settings));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});
