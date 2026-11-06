import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "@testing/factories/clock.factory";
import { TRAY_LEAVE_MS } from "../constants/preview-tray.constants";
import { usePreviewTray } from "./use-preview-tray.hook";

const anOpen = (id = "user-2") => {
  const anchor = document.createElement("li");
  return { id, anchor, picture: anchor };
};

describe("usePreviewTray", () => {
  it("opens a preview's row, and closes it a moment after the pointer leaves", () => {
    onFakeClock();
    const { result } = renderHook(() => usePreviewTray());
    act(() => result.current.show(anOpen()));
    expect(result.current.open?.id).toBe("user-2");
    act(() => result.current.leave());
    act(() => vi.advanceTimersByTime(TRAY_LEAVE_MS - 1));
    expect(result.current.open).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.open).toBeNull();
  });

  it("keeps the row while the pointer comes into it", () => {
    onFakeClock();
    const { result } = renderHook(() => usePreviewTray());
    act(() => result.current.show(anOpen()));
    act(() => result.current.leave());
    act(() => result.current.stay());
    act(() => vi.advanceTimersByTime(TRAY_LEAVE_MS));
    expect(result.current.open).not.toBeNull();
  });

  it("takes the keyboard into the open row, and keeps the row while the focus is in it", () => {
    onFakeClock();
    const { result } = renderHook(() => usePreviewTray());
    const row = document.createElement("div");
    row.innerHTML = "<button>Mute</button>";
    document.body.append(row);
    act(() => result.current.show(anOpen()));
    act(() => result.current.setRow(row));
    expect(result.current.enterRow()).toBe(true);
    expect(document.activeElement).toBe(row.querySelector("button"));
    act(() => result.current.blurred(row.querySelector("button")));
    act(() => vi.advanceTimersByTime(TRAY_LEAVE_MS));
    expect(result.current.open).not.toBeNull();
    act(() => result.current.blurred(null));
    act(() => vi.advanceTimersByTime(TRAY_LEAVE_MS));
    expect(result.current.open).toBeNull();
  });
});
