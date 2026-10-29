import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Capture } from "../../../services/livekit-service/types/livekit.types";
import { aTrack } from "../../../testing/factories/track.factory";
import { useCameraPreview } from "./use-camera-preview.hook";

/** A camera capture of its own, with a way to end it as the browser would. */
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

function preview(answer = aCapture()) {
  const capture = vi.fn(async () => answer.capture);
  const discard = vi.fn();
  const camera = { quality: "720p", mode: "smooth" } as const;
  const hook = renderHook(() => useCameraPreview({ capture, discard, camera, cameraSent: false }));
  return { hook, capture, discard, answer };
}

describe("the camera's preview", () => {
  it("captures the camera for the panel, and stops it when the panel no longer wants it", async () => {
    const { hook, discard, answer } = preview();
    await act(async () => hook.result.current.previewCamera(true));
    expect(hook.result.current.cameraPreview).toBe(answer.capture.preview);

    await act(async () => hook.result.current.previewCamera(false));
    expect(discard).toHaveBeenCalledWith(answer.capture);
    expect(hook.result.current.cameraPreview).toBeUndefined();
  });

  it("stops a camera that answers after the panel closed", async () => {
    let answer: (c: Capture) => void = () => {};
    const late = aCapture();
    const discard = vi.fn();
    const hook = renderHook(() =>
      useCameraPreview({
        capture: () => new Promise<Capture>((resolve) => (answer = resolve)),
        discard,
        camera: { quality: "720p", mode: "smooth" },
        cameraSent: false,
      }),
    );
    act(() => hook.result.current.previewCamera(true));
    act(() => hook.result.current.previewCamera(false));
    await act(async () => answer(late.capture));
    expect(discard).toHaveBeenCalledWith(late.capture);
  });

  it("hands the preview over to be sent as is", async () => {
    const { hook, answer } = preview();
    await act(async () => hook.result.current.previewCamera(true));
    let taken: Capture | null = null;
    act(() => {
      taken = hook.result.current.takePreview();
    });
    expect(taken).toBe(answer.capture);
    expect(hook.result.current.cameraPreview).toBeUndefined();
  });

  it("restarts with another camera, and lets go when the camera goes away", async () => {
    const { hook, discard, capture, answer } = preview();
    await act(async () => hook.result.current.previewCamera(true));
    await act(async () => hook.result.current.restart());
    expect(discard).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledTimes(2);

    act(() => answer.end());
    expect(hook.result.current.cameraPreview).toBeUndefined();
  });

  it("gives the same value while nothing changes", () => {
    const { hook } = preview();
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
