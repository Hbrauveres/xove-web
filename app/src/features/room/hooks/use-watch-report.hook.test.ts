import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Watch } from "../types/room.types";
import type { OnStage } from "../types/watch-report.types";
import { useWatchReport } from "./use-watch-report.hook";
import { REPORT_RETRY_MS, REPORT_STILL_MS } from "../constants/watch-report.constants";

type Props = { watching: Record<string, Watch> | null; inRoom: boolean; onStage: OnStage };

/** The hook in a page that's in the room, reporting to `report`; `watching` is what the API last said. */
function reportingPage(report = vi.fn(async () => {}), watching: Record<string, Watch> | null = {}) {
  vi.useFakeTimers();
  const hook = renderHook(
    ({ watching: w, inRoom, onStage }: Props) => useWatchReport({ watching: w, me: "user-7", inRoom, report, onStage }),
    { initialProps: { watching, inRoom: true, onStage: null } as Props },
  );
  /** What's on my stage changes, as the page would say. */
  const show = (onStage: OnStage, w: Record<string, Watch> | null = watching, inRoom = true) =>
    hook.rerender({ watching: w, inRoom, onStage });
  return { report, show };
}

describe("the watch report", () => {
  it("reports once after a second of stillness, whatever I clicked before", () => {
    const { show, report } = reportingPage();
    show({ personId: "user-2", kind: "screen" });
    act(() => vi.advanceTimersByTime(500));
    show({ personId: "user-3", kind: "camera" });
    act(() => vi.advanceTimersByTime(999));
    expect(report).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith({ sharerId: 3, kind: "camera" });
  });

  it("tries again a moment after a failure", async () => {
    const report = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValue(undefined);
    const { show } = reportingPage(report);
    show({ personId: "user-2", kind: "screen" });
    await act(() => vi.advanceTimersByTimeAsync(REPORT_STILL_MS));
    expect(report).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(REPORT_RETRY_MS));
    await act(() => vi.advanceTimersByTimeAsync(REPORT_STILL_MS));
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("reports again when the API lost it, and not while it knows", () => {
    const { show, report } = reportingPage();
    const marina = { personId: "user-2", kind: "screen" } as const;
    show(marina);
    act(() => vi.advanceTimersByTime(REPORT_STILL_MS));
    show(marina, { "user-7": { sharerId: "user-2", kind: "screen" } });
    act(() => vi.advanceTimersByTime(3000));
    expect(report).toHaveBeenCalledTimes(1);

    show(marina, {});
    act(() => vi.advanceTimersByTime(REPORT_STILL_MS));
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("says nothing from a page that isn't in the video room", () => {
    const { show, report } = reportingPage();
    show({ personId: "user-2", kind: "screen" }, {}, false);
    act(() => vi.advanceTimersByTime(5000));
    expect(report).not.toHaveBeenCalled();
  });

  it("says nothing while the API already knows my stage is empty", () => {
    const { report } = reportingPage();
    act(() => vi.advanceTimersByTime(5000));
    expect(report).not.toHaveBeenCalled();
  });
});
