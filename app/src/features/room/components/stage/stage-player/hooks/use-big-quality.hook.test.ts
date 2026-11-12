import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MediaTrack } from "@services/livekit-service";
import type { LiveFeed } from "../../../../types/room-view.types";

import { useBigQuality } from "./use-big-quality.hook";

const track = (): MediaTrack => ({ attach: (el) => el, detach: (el) => el });

/** A live screen from someone else, capped at `cap`, sent at `height` in `layers` qualities. */
function feed(cap: "1080p" | "720p" | "480p", height = 1080, layers = 3) {
  const setQuality = vi.fn<(q: string) => void>();
  const main: LiveFeed = {
    kind: "screen",
    startedAt: 0,
    settings: { quality: cap, mode: "sharp" },
    remote: { video: track(), height, layers, setQuality },
  };
  return { main, setQuality };
}

describe("the quality asked of the big stream", () => {
  it("is Auto when the sharer sends their best, and back to Auto on leaving", () => {
    const { main, setQuality } = feed("1080p");
    const hook = renderHook(() => useBigQuality(main, false));
    expect(setQuality).toHaveBeenLastCalledWith("auto");
    hook.unmount();
    expect(setQuality).toHaveBeenLastCalledWith("auto");
  });

  it("is the sharer's cap when they send less", () => {
    const { main, setQuality } = feed("720p");
    renderHook(() => useBigQuality(main, false));
    expect(setQuality).toHaveBeenLastCalledWith("720p");
  });

  it("asks nothing of my own stream", () => {
    const { main, setQuality } = feed("720p");
    renderHook(() => useBigQuality(main, true));
    expect(setQuality).not.toHaveBeenCalled();
  });

  it("asks again when the sharer changes their quality", () => {
    const capped = feed("720p");
    const hook = renderHook(({ main }) => useBigQuality(main, false), { initialProps: { main: capped.main } });
    expect(capped.setQuality).toHaveBeenLastCalledWith("720p");
    hook.rerender({ main: { ...capped.main, settings: { quality: "1080p", mode: "sharp" } } });
    expect(capped.setQuality).toHaveBeenLastCalledWith("auto");
  });
});
