import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useKeyboardLast } from "../../hooks/use-keyboard-last.hook";

describe("whether the keyboard moved the focus last", () => {
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
