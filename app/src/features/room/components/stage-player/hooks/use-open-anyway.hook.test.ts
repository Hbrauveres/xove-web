import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOpenAnyway } from "./use-open-anyway.hook";

describe("the small view opened anyway on a narrow picture", () => {
  it("stays opened while the picture stays too narrow", () => {
    const hook = renderHook(({ fits }) => useOpenAnyway(fits), { initialProps: { fits: false } });
    act(() => hook.result.current[1](true));
    hook.rerender({ fits: false });
    expect(hook.result.current[0]).toBe(true);
  });

  it("is forgotten once the picture is wide enough again", () => {
    const hook = renderHook(({ fits }) => useOpenAnyway(fits), { initialProps: { fits: false } });
    act(() => hook.result.current[1](true));
    hook.rerender({ fits: true });
    hook.rerender({ fits: false });
    expect(hook.result.current[0]).toBe(false);
  });
});
