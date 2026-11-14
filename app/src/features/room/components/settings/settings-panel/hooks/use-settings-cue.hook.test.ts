import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SettingsGoTo, SettingsTab } from "../../../../types/settings.types";
import { useSettingsCue } from "./use-settings-cue.hook";

const ALL: SettingsTab[] = ["screen", "camera", "voice"];

function cueOf(usable = ALL) {
  const onEnd = vi.fn();
  const view = renderHook(({ cue, open }) => useSettingsCue(cue, open, usable, onEnd), {
    initialProps: { cue: null as SettingsGoTo | null, open: true },
  });
  return { onEnd, ...view };
}

describe("the cue in the panel", () => {
  it("shows the session's cue while the panel is open", () => {
    const { result, rerender } = cueOf();
    rerender({ cue: { kind: "screen", n: 1 }, open: true });
    expect(result.current).toEqual({ kind: "screen", n: 1 });
    rerender({ cue: { kind: "screen", n: 1 }, open: false });
    expect(result.current).toBeNull();
  });

  it("asks the session to end it at the next press, naming the request it's for", () => {
    const { rerender, onEnd } = cueOf();
    rerender({ cue: { kind: "camera", n: 3 }, open: true });
    act(() => void fireEvent.pointerDown(document.body));
    expect(onEnd).toHaveBeenCalledWith(3);
  });

  it("never cues a tab that can't be used, nor listens for it", () => {
    const { result, rerender, onEnd } = cueOf(["camera", "voice"]);
    rerender({ cue: { kind: "screen", n: 1 }, open: true });
    expect(result.current).toBeNull();
    act(() => void fireEvent.pointerDown(document.body));
    expect(onEnd).not.toHaveBeenCalled();
  });
});
