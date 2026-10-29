import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChangeWindow } from "../../hooks/use-change-window.hook";

const screen = { quality: "1080p", mode: "smooth" } as const;

describe("changing the window", () => {
  it("picks again with my screen's settings, busy meanwhile, and says whether the new pick has sound", async () => {
    let answer: (a: { hasSound: boolean }) => void = () => {};
    const changeScreen = vi.fn(() => new Promise<{ hasSound: boolean }>((resolve) => (answer = resolve)));
    const onSound = vi.fn();
    const hook = renderHook(() => useChangeWindow({ changeScreen, screen, onSound }));

    act(() => hook.result.current.changeScreen());
    expect(hook.result.current.changing).toBe(true);
    await act(async () => answer({ hasSound: true }));

    expect(changeScreen).toHaveBeenCalledWith(screen);
    expect(onSound).toHaveBeenCalledWith(true);
    expect(hook.result.current.changing).toBe(false);
  });

  it("keeps the current share when the picker is closed", async () => {
    const onSound = vi.fn();
    const hook = renderHook(() => useChangeWindow({ changeScreen: async () => null, screen, onSound }));
    await act(async () => hook.result.current.changeScreen());
    expect(onSound).not.toHaveBeenCalled();
  });

  it("gives the same value while nothing changes", () => {
    const inputs = { changeScreen: async () => null, screen, onSound: vi.fn() };
    const hook = renderHook(() => useChangeWindow(inputs));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
