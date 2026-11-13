import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SettingsGoTo, SettingsTab } from "../../../../types/settings.types";
import { useSettingsCue } from "./use-settings-cue.hook";

const ALL: SettingsTab[] = ["screen", "camera", "voice"];

function cueOf(open = true, usable = ALL) {
  const choose = vi.fn();
  const view = renderHook(({ goTo, open: isOpen }) => useSettingsCue(goTo, isOpen, usable, choose), {
    initialProps: { goTo: undefined as SettingsGoTo | undefined, open },
  });
  return { choose, ...view };
}

describe("going to a setting", () => {
  it("chooses its tab and cues it, a second request cueing it again", () => {
    const { result, rerender, choose } = cueOf();
    rerender({ goTo: { kind: "screen", n: 1 }, open: true });
    expect(choose).toHaveBeenLastCalledWith("screen");
    expect(result.current).toEqual({ kind: "screen", n: 1 });
    rerender({ goTo: { kind: "camera", n: 2 }, open: true });
    expect(result.current).toEqual({ kind: "camera", n: 2 });
  });

  it("stays lit through a press on a live button, and goes at a press anywhere else", () => {
    const { result, rerender } = cueOf();
    rerender({ goTo: { kind: "screen", n: 1 }, open: true });
    const live = document.createElement("div");
    live.dataset.dropup = "";
    document.body.append(live);
    act(() => void fireEvent.pointerDown(live));
    expect(result.current).not.toBeNull();
    act(() => void fireEvent.pointerDown(document.body));
    expect(result.current).toBeNull();
    live.remove();
  });

  it("goes when the panel closes, and lets go of what's asked while it's closed", () => {
    const { result, rerender, choose } = cueOf();
    rerender({ goTo: { kind: "camera", n: 1 }, open: true });
    rerender({ goTo: { kind: "camera", n: 1 }, open: false });
    expect(result.current).toBeNull();
    rerender({ goTo: { kind: "screen", n: 2 }, open: false });
    rerender({ goTo: { kind: "screen", n: 2 }, open: true });
    expect(result.current).toBeNull();
    expect(choose).toHaveBeenCalledTimes(1);
  });

  it("never goes to a tab that can't be used", () => {
    const { result, rerender, choose } = cueOf(true, ["camera", "voice"]);
    rerender({ goTo: { kind: "screen", n: 1 }, open: true });
    expect(result.current).toBeNull();
    expect(choose).not.toHaveBeenCalled();
  });
});
