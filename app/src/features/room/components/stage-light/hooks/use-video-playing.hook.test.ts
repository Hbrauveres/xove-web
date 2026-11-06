import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useVideoPlaying } from "./use-video-playing.hook";

function video(paused: boolean) {
  const el = document.createElement("video");
  let p = paused;
  Object.defineProperty(el, "paused", { configurable: true, get: () => p });
  return { el, set: (next: boolean) => (p = next) };
}

describe("whether the video plays", () => {
  it("follows its play and pause events", () => {
    const v = video(false);
    const hook = renderHook(() => useVideoPlaying(v.el));
    expect(hook.result.current).toBe(true);
    v.set(true);
    act(() => {
      v.el.dispatchEvent(new Event("pause"));
    });
    expect(hook.result.current).toBe(false);
  });

  it("is false without a video", () => {
    expect(renderHook(() => useVideoPlaying(null)).result.current).toBe(false);
  });
});
