import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSettingsOpen } from "./use-settings-open.hook";

describe("the settings panel's open state", () => {
  it("starts closed; the cog opens and closes it, and closing twice stays closed", () => {
    const { result } = renderHook(() => useSettingsOpen());
    expect(result.current.open).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.open).toBe(true);
    act(() => result.current.close());
    act(() => result.current.close());
    expect(result.current.open).toBe(false);
  });

  it("counts each request to go to a setting, so the same one twice still counts", () => {
    const { result } = renderHook(() => useSettingsOpen());
    expect(result.current.goTo).toBeUndefined();
    act(() => result.current.goToSetting("camera"));
    act(() => result.current.goToSetting("camera"));
    expect(result.current.goTo).toEqual({ kind: "camera", n: 2 });
  });

  it("gives the same value while nothing changes", () => {
    const { result, rerender } = renderHook(() => useSettingsOpen());
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});
