import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useCameraPreviewSwitch } from "./use-camera-preview-switch.hook";

describe("the camera's preview switch", () => {
  it("turns the preview on while wanted and off when not, telling each change once", () => {
    const onPreview = vi.fn();
    const { rerender } = renderHook(({ wanted }) => useCameraPreviewSwitch(wanted, onPreview), {
      initialProps: { wanted: false },
    });
    expect(onPreview).not.toHaveBeenCalled();
    rerender({ wanted: true });
    rerender({ wanted: true });
    expect(onPreview.mock.calls).toEqual([[true]]);
    rerender({ wanted: false });
    expect(onPreview).toHaveBeenLastCalledWith(false);
  });

  it("turns it off when the panel leaves", () => {
    const onPreview = vi.fn();
    const { unmount } = renderHook(() => useCameraPreviewSwitch(true, onPreview));
    unmount();
    expect(onPreview).toHaveBeenLastCalledWith(false);
  });

  it("still previews after React's development double mount", () => {
    const onPreview = vi.fn();
    renderHook(() => useCameraPreviewSwitch(true, onPreview), { wrapper: StrictMode });
    expect(onPreview).toHaveBeenLastCalledWith(true);
  });
});
