import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import {
  CANT_REACH,
  FAILED,
  GAVE_UP,
  PLEASE_WAIT,
  RECONNECTING,
  TICK_MS,
  TRY_AGAIN,
  TRYING_NOW,
} from "./constants/cant-reach.constants";
import { CantReachPage as CantReach } from "./cant-reach.page";

describe("the page when Xovê can't tell who's signed in", () => {
  it("out of reach, counts down to the next try, says it's reconnecting, and offers nothing to press", () => {
    onFakeClock();
    render(<CantReach state={{ status: "unreachable", nextTryAt: Date.now() + 8 * TICK_MS }} onRetry={vi.fn()} />);
    expect(screen.getByRole("heading", { name: CANT_REACH })).toBeInTheDocument();
    expect(screen.getByText("Trying again in 8 s.")).toBeInTheDocument();
    expect(screen.getByText(RECONNECTING)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3 * TICK_MS));
    expect(screen.getByText("Trying again in 5 s.")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5 * TICK_MS));
    expect(screen.getByText(TRYING_NOW)).toBeInTheDocument();
  });

  it("once it stopped trying, says so and offers Try again", async () => {
    const onRetry = vi.fn();
    const user = onFakeClock();
    render(<CantReach state={{ status: "unreachable", nextTryAt: null }} onRetry={onRetry} />);
    expect(screen.getByText(GAVE_UP)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: TRY_AGAIN }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("on a failure, offers Try again; while it tries, Please wait, which can't be pressed", () => {
    const { rerender } = render(<CantReach state={{ status: "failed", busy: false }} onRetry={vi.fn()} />);
    expect(screen.getByRole("heading", { name: FAILED })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: TRY_AGAIN })).toBeEnabled();
    rerender(<CantReach state={{ status: "failed", busy: true }} onRetry={vi.fn()} />);
    expect(screen.getByRole("button", { name: PLEASE_WAIT })).toBeDisabled();
    expect(screen.queryByRole("button", { name: TRY_AGAIN })).not.toBeInTheDocument();
  });

  it("never says why: no code, no cause", () => {
    for (const state of [
      { status: "unreachable", nextTryAt: null },
      { status: "failed", busy: false },
    ] as const) {
      const { container, unmount } = render(<CantReach state={state} onRetry={vi.fn()} />);
      expect(container).not.toHaveTextContent(/\d{3}|server|api|error|network|timeout/i);
      unmount();
    }
  });
});
