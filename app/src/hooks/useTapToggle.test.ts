import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardLast, useTapToggle } from "./useTapToggle";

type Ev = Parameters<ReturnType<typeof useTapToggle>["down"]>[0];
const picture = document.createElement("div");
const button = document.createElement("button");
const ev = (pointerType: string, x = 100, y = 100, timeStamp = 0, target: Element = picture) =>
  ({ pointerType, clientX: x, clientY: y, timeStamp, target }) as unknown as Ev;

function setup(shown: boolean) {
  const onShow = vi.fn();
  const onHide = vi.fn();
  const { result, rerender } = renderHook(({ shown }) => useTapToggle({ shown, onShow, onHide }), {
    initialProps: { shown },
  });
  return { tap: () => result.current, onShow, onHide, rerender };
}

describe("a tap shows or hides the controls (spec 0131, design decision 16)", () => {
  it("shows them on a finger's tap when they're hidden, and hides them when they're shown", () => {
    const hidden = setup(false);
    hidden.tap().down(ev("touch"));
    hidden.tap().up(ev("touch", 100, 100, 120));
    expect(hidden.onShow).toHaveBeenCalledTimes(1);
    expect(hidden.onHide).not.toHaveBeenCalled();

    const shown = setup(true);
    shown.tap().down(ev("touch"));
    shown.tap().up(ev("touch", 100, 100, 120));
    expect(shown.onHide).toHaveBeenCalledTimes(1);
  });

  it("leaves them alone when the finger presses a button: buttons are only buttons", () => {
    const { tap, onShow, onHide } = setup(true);
    tap().down(ev("touch", 100, 100, 0, button));
    tap().up(ev("touch", 100, 100, 120, button));
    expect(onHide).not.toHaveBeenCalled();
    // Pressing a control keeps them up (the idle timer restarts).
    expect(onShow).toHaveBeenCalled();
  });

  it("only shows them on a drag (a swipe), never hides them", () => {
    const { tap, onShow, onHide } = setup(true);
    tap().down(ev("touch"));
    tap().move(ev("touch", 140, 100, 50));
    tap().up(ev("touch", 140, 100, 120));
    expect(onShow).toHaveBeenCalled();
    expect(onHide).not.toHaveBeenCalled();
  });

  it("treats a long press as a hold, not a tap", () => {
    const { tap, onShow, onHide } = setup(true);
    tap().down(ev("touch"));
    tap().up(ev("touch", 100, 100, 700));
    expect(onHide).not.toHaveBeenCalled();
    expect(onShow).not.toHaveBeenCalled();
  });

  it("shows them on any mouse move or press, as before", () => {
    const { tap, onShow, onHide } = setup(true);
    tap().move(ev("mouse"));
    tap().down(ev("mouse"));
    tap().up(ev("mouse", 100, 100, 50));
    expect(onShow).toHaveBeenCalledTimes(2);
    expect(onHide).not.toHaveBeenCalled();
  });
});

describe("whether the keyboard moved the focus last (spec 0131)", () => {
  it("is the keyboard until a press, and again after a key", () => {
    const { result } = renderHook(() => useKeyboardLast());
    expect(result.current()).toBe(true);
    act(() => {
      document.dispatchEvent(new Event("pointerdown"));
    });
    expect(result.current()).toBe(false);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    });
    expect(result.current()).toBe(true);
  });
});
