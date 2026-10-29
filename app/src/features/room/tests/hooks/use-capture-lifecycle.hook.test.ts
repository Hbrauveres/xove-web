import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Capture } from "@core/livekit/types/livekit.types";
import { aTrack } from "../../../../test/factories/track.factory";
import { useCaptureLifecycle } from "../../hooks/use-capture-lifecycle.hook";

function aCapture() {
  const ended: (() => void)[] = [];
  const capture: Capture = {
    kind: "camera",
    preview: aTrack(),
    hasSound: false,
    onEnded: (cb) => {
      ended.push(cb);
      return () => {};
    },
  };
  return { capture, end: () => ended.forEach((cb) => cb()) };
}

describe("a capture that isn't sent", () => {
  it("goes when the browser ends it", () => {
    const { capture, end } = aCapture();
    const discard = vi.fn();
    const clear = vi.fn();
    renderHook(() => useCaptureLifecycle(capture, { current: capture }, discard, clear));
    end();
    expect(discard).toHaveBeenCalledWith(capture);
    expect(clear).toHaveBeenCalled();
  });

  it("goes when the page closes with it on", () => {
    const { capture } = aCapture();
    const discard = vi.fn();
    const hook = renderHook(() => useCaptureLifecycle(capture, { current: capture }, discard, vi.fn()));
    hook.unmount();
    expect(discard).toHaveBeenCalledWith(capture);
  });
});
