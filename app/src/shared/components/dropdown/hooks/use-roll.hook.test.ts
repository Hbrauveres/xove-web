import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ROLL_MS } from "../constants/dropdown.constants";
import { useRoll } from "./use-roll.hook";

it("stays on the page while it rolls up, then goes", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ open }) => useRoll(open), { initialProps: { open: true } });
  expect(result.current.mounted).toBe(true);
  rerender({ open: false });
  expect(result.current).toEqual({ mounted: true, rolledOut: false });
  act(() => vi.advanceTimersByTime(ROLL_MS));
  expect(result.current.mounted).toBe(false);
});
