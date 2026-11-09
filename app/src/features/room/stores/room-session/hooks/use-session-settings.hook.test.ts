import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SessionCore, SettingsOpen } from "../types/room-session.types";
import { useSessionSettings } from "./use-session-settings.hook";

const sent = { attach: vi.fn(), detach: vi.fn() };
const preview = { attach: vi.fn(), detach: vi.fn() };
const settings: SettingsOpen = {
  open: true,
  toggle: vi.fn(),
  close: vi.fn(),
  goTo: { kind: "camera", n: 1 },
  goToSetting: vi.fn(),
};
const coreWith = (camera: boolean) =>
  ({
    mine: { screen: false, camera },
    cameraPreview: preview,
    video: { local: { camera: sent }, voice: false },
  }) as unknown as SessionCore;

describe("the settings panel's part of the session", () => {
  it("shows the camera being sent while it's live, and the preview's otherwise", () => {
    const live = renderHook(() => useSessionSettings(coreWith(true), settings)).result.current;
    const off = renderHook(() => useSessionSettings(coreWith(false), settings)).result.current;
    expect(live.cameraVideo).toBe(sent);
    expect(off.cameraVideo).toBe(preview);
  });

  it("opens, closes and goes to a setting as the room asks", () => {
    const { result } = renderHook(() => useSessionSettings(coreWith(false), settings));
    expect(result.current.open).toBe(true);
    expect(result.current.onClose).toBe(settings.close);
    expect(result.current.goTo).toEqual({ kind: "camera", n: 1 });
  });

  it("gives the same value while nothing changes", () => {
    const core = coreWith(false);
    const { result, rerender } = renderHook(() => useSessionSettings(core, settings));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});
