import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CLOSE_MS } from "../constants/picker.constants";
import { useListRoll } from "./use-list-roll.hook";

it("stays drawn while it rolls back, then goes", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ open }) => useListRoll(open), { initialProps: { open: true } });
  expect(result.current.drawn).toBe(true);
  rerender({ open: false });
  expect(result.current).toEqual({ drawn: true, unrolled: false });
  act(() => vi.advanceTimersByTime(CLOSE_MS));
  expect(result.current.drawn).toBe(false);
});
