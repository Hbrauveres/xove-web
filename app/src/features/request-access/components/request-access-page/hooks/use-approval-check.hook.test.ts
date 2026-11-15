import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { APPROVAL_CHECK_MS } from "../constants/request-access.constants";
import { useApprovalCheck } from "./use-approval-check.hook";

it("asks again every 20 s while the request waits", () => {
  vi.useFakeTimers();
  const refresh = vi.fn(() => Promise.resolve());
  renderHook(() => useApprovalCheck(true, refresh));

  vi.advanceTimersByTime(APPROVAL_CHECK_MS - 1);
  expect(refresh).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(refresh).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(APPROVAL_CHECK_MS);
  expect(refresh).toHaveBeenCalledTimes(2);
});

it("doesn't ask while nothing waits, and stops when the page goes", () => {
  vi.useFakeTimers();
  const refresh = vi.fn(() => Promise.resolve());
  const { rerender, unmount } = renderHook(({ waiting }) => useApprovalCheck(waiting, refresh), {
    initialProps: { waiting: false },
  });
  vi.advanceTimersByTime(APPROVAL_CHECK_MS * 2);
  expect(refresh).not.toHaveBeenCalled();

  rerender({ waiting: true });
  unmount();
  vi.advanceTimersByTime(APPROVAL_CHECK_MS * 2);
  expect(refresh).not.toHaveBeenCalled();
});

it("keeps asking after a check fails: the network comes back", () => {
  vi.useFakeTimers();
  const refresh = vi.fn(() => Promise.reject(new Error("offline")));
  renderHook(() => useApprovalCheck(true, refresh));
  vi.advanceTimersByTime(APPROVAL_CHECK_MS * 2);
  expect(refresh).toHaveBeenCalledTimes(2);
});
