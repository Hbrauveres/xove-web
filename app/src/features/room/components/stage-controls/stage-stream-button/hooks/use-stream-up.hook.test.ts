import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStreamUp } from "./use-stream-up.hook";

describe("useStreamUp", () => {
  it("closes the drop-up when something is done from it, then does it", () => {
    const change = vi.fn();
    const { result } = renderHook(() => useStreamUp());
    act(() => result.current.onUpOpen(true));
    act(() => result.current.done(change)("cam-2"));
    expect(result.current.upOpen).toBe(false);
    expect(change).toHaveBeenCalledWith("cam-2");
  });

  it("tells the player while the camera's list is open, and closes the list with the drop-up", () => {
    const onMenuChange = vi.fn();
    const { result } = renderHook(() => useStreamUp(onMenuChange));
    act(() => result.current.onListOpen(true));
    expect(onMenuChange).toHaveBeenCalledWith(true);
    act(() => result.current.onUpOpen(false));
    expect(result.current.listOpen).toBe(false);
  });
});
