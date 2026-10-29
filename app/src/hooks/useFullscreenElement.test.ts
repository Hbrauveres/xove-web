import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFullscreenElement } from "./useFullscreenElement";

/** Each test's own fullscreen: `page.fullscreen` is what the browser says is fullscreen (setup removes it after). */
function onPage() {
  const page = { fullscreen: null as Element | null };
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => page.fullscreen });
  return { page };
}

describe("the fullscreen element (spec 0101)", () => {
  it("is the player when the player is fullscreen", () => {
    const { page } = onPage();
    const hook = renderHook(() => useFullscreenElement());
    const player = document.createElement("div");
    page.fullscreen = player;
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(hook.result.current).toBe(player);
  });

  it("is none again once the player leaves fullscreen", () => {
    const { page } = onPage();
    const hook = renderHook(() => useFullscreenElement());
    page.fullscreen = document.createElement("div");
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    page.fullscreen = null;
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(hook.result.current).toBeNull();
  });
});
