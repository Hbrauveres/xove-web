import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePictureWidth } from "./use-picture-width.hook";

/** The browser's size watcher, played by hand: `resize` reports a new width for what it watches. */
function watchSizes() {
  let report: (() => void) | null = null;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: () => void) {
        report = cb;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  return { resize: () => act(() => report?.()), disconnect };
}

/** A layer as wide as the browser would lay it out. */
function layer(width: number) {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => ({ width }) as DOMRect;
  return el;
}

describe("the picture's width", () => {
  it("is the layer's width, and follows it when the picture changes shape", () => {
    const sizes = watchSizes();
    const el = layer(480);
    const hook = renderHook(() => usePictureWidth());
    act(() => hook.result.current.ref(el));
    expect(hook.result.current.width).toBe(480);
    expect(hook.result.current.el).toBe(el);
    el.getBoundingClientRect = () => ({ width: 190 }) as DOMRect;
    sizes.resize();
    expect(hook.result.current.width).toBe(190);
  });

  it("stops watching when the layer goes", () => {
    const sizes = watchSizes();
    const hook = renderHook(() => usePictureWidth());
    act(() => hook.result.current.ref(layer(480)));
    act(() => hook.result.current.ref(null));
    expect(sizes.disconnect).toHaveBeenCalled();
  });

  it("is unknown while the layer isn't laid out", () => {
    watchSizes();
    const hook = renderHook(() => usePictureWidth());
    act(() => hook.result.current.ref(layer(0)));
    expect(hook.result.current.width).toBeNull();
  });

  it("is unknown until there's a layer", () => {
    watchSizes();
    expect(renderHook(() => usePictureWidth()).result.current.width).toBeNull();
  });
});
