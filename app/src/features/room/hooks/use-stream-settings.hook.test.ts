import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStreamSettings } from "./use-stream-settings.hook";

/** The hook with my screen live (or not), applying and asking the API through fakes. */
function settings(live = true, accepted = true) {
  const applySettings = vi.fn(async () => {});
  const changeAtApi = vi.fn(async () => accepted);
  const streams = { screen: live, camera: false };
  const hook = renderHook(() => useStreamSettings({ live: streams, publishing: streams, applySettings, changeAtApi }));
  return { hook, applySettings, changeAtApi };
}

describe("how I send my streams", () => {
  it("remembers a change, and only remembers it while the stream isn't live", () => {
    const { hook, changeAtApi } = settings(false);
    act(() => hook.result.current.setPrefs("screen", { quality: "720p", mode: "sharp" }));
    expect(hook.result.current.prefs.screen).toEqual({ quality: "720p", mode: "sharp" });
    expect(localStorage.getItem("xove.share.quality")).toBe("720p");
    expect(changeAtApi).not.toHaveBeenCalled();
  });

  it("applies a change live, to the video and the API", async () => {
    const { hook, applySettings, changeAtApi } = settings();
    await act(async () => hook.result.current.setPrefs("screen", { quality: "480p", mode: "smooth" }));
    expect(applySettings).toHaveBeenCalledWith("screen", { quality: "480p", mode: "smooth" });
    expect(changeAtApi).toHaveBeenCalledWith("screen", { quality: "480p", mode: "smooth" });
  });

  it("puts a refused change back, on the video and in what's remembered", async () => {
    const { hook, applySettings } = settings(true, false);
    const before = hook.result.current.prefs.screen;
    await act(async () => hook.result.current.setPrefs("screen", { quality: "480p", mode: "sharp" }));
    expect(applySettings).toHaveBeenLastCalledWith("screen", before);
    expect(hook.result.current.prefs.screen).toEqual(before);
  });

  it("gives the same value while nothing changes", () => {
    const { hook } = settings();
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });

  it("starts each stream from what this browser remembered", () => {
    localStorage.setItem("xove.share.quality", "720p");
    localStorage.setItem("xove.share.mode", "sharp");
    localStorage.setItem("xove.camera.quality", "480p");
    const { hook } = settings(false);
    expect(hook.result.current.prefs.screen).toEqual({ quality: "720p", mode: "sharp" });
    expect(hook.result.current.prefs.camera.quality).toBe("480p");
  });
});
