import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../../testing/factories/sharer.factory";
import { useGoToMine } from "./use-go-to-mine.hook";

/** Me, live. */
const me = () => [{ ...aSharer({ id: "me" }), isMe: true }];

describe("going to my stream", () => {
  it("starts it, then puts me on my stage once I'm live", () => {
    const start = vi.fn();
    const pick = vi.fn();
    const hook = renderHook(({ sharers }) => useGoToMine(start, pick, sharers), {
      initialProps: { sharers: [aSharer()] },
    });
    act(() => hook.result.current("screen"));
    expect(start).toHaveBeenCalledWith("screen");
    expect(pick).not.toHaveBeenCalled();
    hook.rerender({ sharers: me() });
    expect(pick).toHaveBeenCalledWith("me");
  });

  it("goes to me at once when I'm already live, once a start", () => {
    const pick = vi.fn();
    const sharers = me();
    const hook = renderHook(() => useGoToMine(vi.fn(), pick, sharers));
    expect(pick).not.toHaveBeenCalled();
    act(() => hook.result.current("camera"));
    hook.rerender();
    expect(pick).toHaveBeenCalledTimes(1);
  });
});
