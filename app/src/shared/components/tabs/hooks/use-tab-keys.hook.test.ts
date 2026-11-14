import { renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useTabKeys } from "./use-tab-keys.hook";

const press = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent;

describe("the tabs' arrow keys", () => {
  it("move to the next usable tab and round the ends, focusing it", () => {
    const onChoose = vi.fn();
    const focusOn = vi.fn();
    const { result } = renderHook(() => useTabKeys(["camera", "voice"], "voice", onChoose, focusOn));
    result.current(press("ArrowRight"));
    expect(onChoose).toHaveBeenLastCalledWith("camera");
    expect(focusOn).toHaveBeenLastCalledWith("camera");
    result.current(press("ArrowLeft"));
    expect(onChoose).toHaveBeenLastCalledWith("camera");
  });

  it("leave other keys, and a single usable tab, alone", () => {
    const onChoose = vi.fn();
    const one = renderHook(() => useTabKeys(["voice"], "voice", onChoose, vi.fn()));
    one.result.current(press("ArrowRight"));
    const two = renderHook(() => useTabKeys(["camera", "voice"], "voice", onChoose, vi.fn()));
    const enter = press("Enter");
    two.result.current(enter);
    expect(onChoose).not.toHaveBeenCalled();
    expect(enter.preventDefault).not.toHaveBeenCalled();
  });
});
