import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { OPEN_DELAY_MS } from "@shared/constants/floating.constants";
import { floatingStore } from "@shared/stores/floating-store";
import { useDropUp } from "./use-drop-up.hook";

it("opens after the mouse rests, not before", () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useDropUp({ enabled: true }));
  act(() => result.current.handlers.onPointerEnter());
  expect(result.current.open).toBe(false);
  act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
  expect(result.current.open).toBe(true);
});

it("sent elsewhere (the settings open), a rest follows even over an open list, which closes first", () => {
  vi.useFakeTimers();
  const list = document.body.appendChild(document.createElement("div"));
  const closeList = vi.fn(() => floatingStore.remove(opened));
  const opened = { kind: "opened" as const, close: closeList, area: () => list };
  floatingStore.add(opened);
  const redirect = vi.fn();
  const { result } = renderHook(() => useDropUp({ enabled: true, redirect }));
  for (const time of [1, 2]) {
    act(() => result.current.handlers.onPointerEnter());
    act(() => vi.advanceTimersByTime(OPEN_DELAY_MS));
    expect(redirect).toHaveBeenCalledTimes(time);
    act(() => result.current.handlers.onPointerLeave());
  }
  expect(closeList).toHaveBeenCalledTimes(1);
  expect(result.current.open).toBe(false);
  list.remove();
});
