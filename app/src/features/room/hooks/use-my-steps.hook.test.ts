import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomStore } from "../stores/room-store/room.store";
import { useMySteps } from "./use-my-steps.hook";

describe("my streams' steps", () => {
  it("moves a stream along its steps, and says when a start is under way", () => {
    const store = new RoomStore("Henrique", 60_000);
    const hook = renderHook(() => useMySteps(store));
    act(() => hook.result.current.step("screen", "picking"));
    expect(store.getState().model.mine.screen).toBe("picking");
    expect(hook.result.current.busy("screen")).toBe(true);
    expect(hook.result.current.busy("camera")).toBe(false);
  });

  it("gives the same value while nothing changes", () => {
    const store = new RoomStore("Henrique", 60_000);
    const hook = renderHook(() => useMySteps(store));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
