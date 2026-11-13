import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PANEL_MS } from "../constants/settings-panel.constants";
import { usePanelPresence } from "./use-panel-presence.hook";

describe("the panel's presence", () => {
  it("arrives at once and slides in on the next frame; slides out at once and leaves after its slide", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ open }) => usePanelPresence(open), { initialProps: { open: false } });
    expect(result.current).toEqual({ present: false, shown: false });
    rerender({ open: true });
    expect(result.current).toEqual({ present: true, shown: false });
    act(() => vi.advanceTimersToNextFrame());
    expect(result.current).toEqual({ present: true, shown: true });
    rerender({ open: false });
    expect(result.current).toEqual({ present: true, shown: false });
    act(() => vi.advanceTimersByTime(PANEL_MS));
    expect(result.current.present).toBe(false);
  });
});
