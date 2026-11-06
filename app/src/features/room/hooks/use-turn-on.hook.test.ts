import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTurnOn } from "./use-turn-on.hook";

const motion = (reduce: boolean) =>
  vi
    .spyOn(window, "matchMedia")
    .mockImplementation((q: string) => ({ matches: reduce && q.includes("reduce") }) as MediaQueryList);

describe("the TV turning on", () => {
  it("plays when asked, until its animation ends", () => {
    motion(false);
    const hook = renderHook(() => useTurnOn(true));
    expect(hook.result.current.turningOn).toBe(true);
    act(() => hook.result.current.ended());
    expect(hook.result.current.turningOn).toBe(false);
  });

  it("doesn't play when not asked, and keeps its first answer", () => {
    motion(false);
    const hook = renderHook(({ on }) => useTurnOn(on), { initialProps: { on: false } });
    hook.rerender({ on: true });
    expect(hook.result.current.turningOn).toBe(false);
  });

  it("never plays for reduced motion", () => {
    motion(true);
    expect(renderHook(() => useTurnOn(true)).result.current.turningOn).toBe(false);
  });
});
