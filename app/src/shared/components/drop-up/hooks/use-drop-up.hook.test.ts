import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { OPEN_DELAY_MS } from "@shared/constants/floating.constants";
import { useDropUp } from "./use-drop-up.hook";

it("opens after the mouse rests, not before", () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useDropUp({ enabled: true }));
  act(() => result.current.handlers.onPointerEnter());
  expect(result.current.open).toBe(false);
  act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
  expect(result.current.open).toBe(true);
});
