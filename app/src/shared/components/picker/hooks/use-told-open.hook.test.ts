import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useToldOpen } from "./use-told-open.hook";

it("keeps its own state when not told, saying when it changes and when it goes away open", () => {
  const onChange = vi.fn();
  const { result, unmount } = renderHook(() => useToldOpen(undefined, onChange));
  act(() => result.current.setOpen(true));
  expect(result.current.open).toBe(true);
  expect(onChange).toHaveBeenLastCalledWith(true);
  unmount();
  expect(onChange).toHaveBeenLastCalledWith(false);
});

it("told from outside, it only asks", () => {
  const onChange = vi.fn();
  const { result } = renderHook(() => useToldOpen(false, onChange));
  act(() => result.current.setOpen(true));
  expect(result.current.open).toBe(false);
  expect(onChange).toHaveBeenCalledWith(true);
});
