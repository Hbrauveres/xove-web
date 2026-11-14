import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useToldOpen } from "./use-told-open.hook";

describe("a drop-up's open state", () => {
  it("keeps its own when nobody tells it, and tells every change", () => {
    const told = vi.fn();
    const { result } = renderHook(() => useToldOpen(undefined, told));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(told).toHaveBeenCalledWith(true);
  });

  it("follows its owner when told, asking it to change rather than changing", () => {
    const told = vi.fn();
    const { result } = renderHook(() => useToldOpen(false, told));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(false);
    expect(told).toHaveBeenCalledWith(true);
  });
});
