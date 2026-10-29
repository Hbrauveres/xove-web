import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSoundUnlock } from "./use-sound-unlock.hook";

describe("unlocking the page's sound", () => {
  it("asks on each click or key, until the page closes", () => {
    const unlock = vi.fn();
    const hook = renderHook(() => useSoundUnlock(unlock));

    document.dispatchEvent(new Event("pointerup"));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    hook.unmount();
    document.dispatchEvent(new Event("pointerup"));

    expect(unlock).toHaveBeenCalledTimes(2);
  });
});
