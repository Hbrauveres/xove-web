import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Watch } from "../state/room.types";
import { useWatchReport } from "./use-watch-report.hook";

/** The hook in a page that's in the room, reporting to `report`; `watching` is what the API last said. */
function reportingPage(report = vi.fn(async () => {}), watching: Record<string, Watch> | null = {}) {
  vi.useFakeTimers();
  const hook = renderHook(({ watching: w, inRoom }) => useWatchReport({ watching: w, me: "user-7", inRoom, report }), {
    initialProps: { watching, inRoom: true },
  });
  return { hook, report };
}

describe("the watch report", () => {
  it("reports once after a second of stillness, whatever I clicked before", () => {
    const { hook, report } = reportingPage();
    act(() => hook.result.current({ personId: "user-2", kind: "screen" }));
    act(() => vi.advanceTimersByTime(500));
    act(() => hook.result.current({ personId: "user-3", kind: "camera" }));
    act(() => vi.advanceTimersByTime(999));
    expect(report).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith({ sharerId: 3, kind: "camera" });
  });

  it("tries again a moment after a failure", async () => {
    const report = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValue(undefined);
    const { hook } = reportingPage(report);
    act(() => hook.result.current({ personId: "user-2", kind: "screen" }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(report).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(2000));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("reports again when the API lost it, and not while it knows", () => {
    const { hook, report } = reportingPage();
    act(() => hook.result.current({ personId: "user-2", kind: "screen" }));
    act(() => vi.advanceTimersByTime(1000));
    hook.rerender({ watching: { "user-7": { sharerId: "user-2", kind: "screen" } }, inRoom: true });
    act(() => vi.advanceTimersByTime(3000));
    expect(report).toHaveBeenCalledTimes(1);

    hook.rerender({ watching: {}, inRoom: true });
    act(() => vi.advanceTimersByTime(1000));
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("says nothing from a page that isn't in the video room", () => {
    const { hook, report } = reportingPage();
    hook.rerender({ watching: {}, inRoom: false });
    act(() => hook.result.current({ personId: "user-2", kind: "screen" }));
    act(() => vi.advanceTimersByTime(5000));
    expect(report).not.toHaveBeenCalled();
  });

  it("gives the same setter while nothing changes", () => {
    const { hook } = reportingPage();
    const before = hook.result.current;
    hook.rerender({ watching: {}, inRoom: true });
    expect(hook.result.current).toBe(before);
  });
});
