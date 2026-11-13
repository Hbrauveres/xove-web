import { renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useTabKeys } from "./use-tab-keys.hook";

const press = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent;

describe("the tabs' arrow keys", () => {
  it("move to the next usable tab and round the ends, focusing it", () => {
    const onChoose = vi.fn();
    const { result } = renderHook(() => useTabKeys(["camera", "voice"], "voice", onChoose));
    const camera = document.createElement("button");
    document.body.append(camera);
    result.current.refOf("camera")(camera);
    result.current.onKeyDown(press("ArrowRight"));
    expect(onChoose).toHaveBeenLastCalledWith("camera");
    expect(camera).toHaveFocus();
    result.current.onKeyDown(press("ArrowLeft"));
    expect(onChoose).toHaveBeenLastCalledWith("camera");
    camera.remove();
  });

  it("leave other keys, and a single usable tab, alone", () => {
    const onChoose = vi.fn();
    const one = renderHook(() => useTabKeys(["voice"], "voice", onChoose));
    one.result.current.onKeyDown(press("ArrowRight"));
    const two = renderHook(() => useTabKeys(["camera", "voice"], "voice", onChoose));
    const enter = press("Enter");
    two.result.current.onKeyDown(enter);
    expect(onChoose).not.toHaveBeenCalled();
    expect(enter.preventDefault).not.toHaveBeenCalled();
  });
});
