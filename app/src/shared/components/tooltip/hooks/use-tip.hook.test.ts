import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TIP_REST_MS } from "@shared/constants/floating.constants";
import { useTip } from "./use-tip.hook";

const options = (quiet = false) => ({ tip: { current: null }, anchor: { current: null }, quiet, text: "Hello" });

it("shows after a rest, goes when told to keep quiet", () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ quiet }) => useTip(options(quiet)), { initialProps: { quiet: false } });
  act(() => result.current.rest());
  expect(result.current.shown).toBe(false);
  act(() => vi.advanceTimersByTime(TIP_REST_MS));
  expect(result.current.shown).toBe(true);
  rerender({ quiet: true });
  expect(result.current.shown).toBe(false);
});

it("with cutOnly, shows only when its control's text is cut", () => {
  const control = document.createElement("button");
  const name = control.appendChild(document.createElement("span"));
  let needs = 120;
  Object.defineProperty(name, "clientWidth", { value: 120 });
  Object.defineProperty(name, "scrollWidth", { get: () => needs });
  const opts = {
    tip: { current: null },
    anchor: { current: control },
    quiet: false,
    text: "OBS Virtual Camera",
    cutOnly: true,
  };
  const { result } = renderHook(() => useTip(opts));
  act(() => result.current.show());
  expect(result.current.shown).toBe(false);
  needs = 180;
  act(() => result.current.show());
  expect(result.current.shown).toBe(true);
});
