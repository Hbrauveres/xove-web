import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SettingsGoTo, SettingsTab } from "../../../../types/settings.types";
import { useChosenTab } from "./use-chosen-tab.hook";

const ALL: SettingsTab[] = ["screen", "camera", "voice"];

function tabOf(usable = ALL, goTo?: SettingsGoTo) {
  return renderHook(({ goTo: asked, usable: can }) => useChosenTab(asked, can), {
    initialProps: { goTo, usable },
  });
}

describe("the chosen tab", () => {
  it("starts on the first usable tab, and a click chooses another", () => {
    const { result } = tabOf(["camera", "voice"]);
    expect(result.current.tab).toBe("camera");
    act(() => result.current.choose("voice"));
    expect(result.current.tab).toBe("voice");
  });

  it("follows a live button's request, and a click after it wins again", () => {
    const { result, rerender } = tabOf();
    rerender({ goTo: { kind: "camera", n: 1 }, usable: ALL });
    expect(result.current.tab).toBe("camera");
    act(() => result.current.choose("voice"));
    expect(result.current.tab).toBe("voice");
    rerender({ goTo: { kind: "camera", n: 2 }, usable: ALL });
    expect(result.current.tab).toBe("camera");
  });

  it("ignores a request made before it was there, and one for a tab that can't be used", () => {
    const { result, rerender } = tabOf(["camera", "voice"], { kind: "camera", n: 4 });
    act(() => result.current.choose("voice"));
    rerender({ goTo: { kind: "screen", n: 5 }, usable: ["camera", "voice"] });
    expect(result.current.tab).toBe("voice");
  });

  it("falls back to the first usable tab when the chosen one becomes unusable", () => {
    const { result, rerender } = tabOf();
    act(() => result.current.choose("screen"));
    rerender({ goTo: undefined, usable: ["camera", "voice"] });
    expect(result.current.tab).toBe("camera");
  });
});
