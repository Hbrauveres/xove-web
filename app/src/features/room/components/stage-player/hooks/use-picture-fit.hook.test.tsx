import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../../testing/factories/stream-controls.factory";
import { usePictureFit } from "./use-picture-fit.hook";

/** A layer the browser lays out this wide, the size watcher left out. */
function layer(width: number) {
  vi.stubGlobal("ResizeObserver", undefined);
  const el = document.createElement("div");
  el.getBoundingClientRect = () => ({ width }) as DOMRect;
  return el;
}

describe("what fits on the picture", () => {
  it("everything on a wide picture", () => {
    const hook = renderHook(() => usePictureFit(aSharer(), aStreamControls()));
    act(() => hook.result.current.setLayer(layer(1500)));
    expect(hook.result.current.fit.folded).toEqual([]);
    expect(hook.result.current.smallView).toBe(true);
  });

  it("on a very narrow one, the bar folded and the small view not fitting", () => {
    const hook = renderHook(() => usePictureFit(aSharer(), aStreamControls()));
    act(() => hook.result.current.setLayer(layer(80)));
    expect(hook.result.current.fit.folded).toEqual(["go-live", "sound", "voice"]);
    expect(hook.result.current.smallView).toBe(false);
  });
});
