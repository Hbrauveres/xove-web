import { act, renderHook } from "@testing-library/react";
import type { PointerEvent } from "react";
import { describe, expect, it } from "vitest";
import { toastStore } from "@shared/stores/toast-store";
import { useTouchReason } from "./use-touch-reason.hook";

const down = (pointerType: string) => ({ pointerType }) as unknown as PointerEvent;

describe("saying why on a touch", () => {
  it("toasts the reason after a finger's tap, not after a mouse's click", () => {
    const { result } = renderHook(() => useTouchReason());
    act(() => {
      result.current.onPointerDown(down("mouse"));
      result.current.sayWhy("Not here", "screen-off");
    });
    expect(toastStore.current()).toBeNull();
    act(() => {
      result.current.onPointerDown(down("touch"));
      result.current.sayWhy("Not here", "screen-off");
    });
    expect(toastStore.current()?.text).toBe("Not here");
  });
});
