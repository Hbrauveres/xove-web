import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActivityEvent } from "../../../types/room-view.types";
import { useActivitySeen } from "./use-activity-seen.hook";

const ev = (id: string): ActivityEvent => ({ id, kind: "joined", actorId: "x", at: 0 });

describe("what's new in the activity", () => {
  it("counts everything new until the list opens, then nothing while it's open", () => {
    const hook = renderHook(({ events }) => useActivitySeen(events), { initialProps: { events: [ev("a"), ev("b")] } });
    expect(hook.result.current.fresh).toBe(2);
    act(() => hook.result.current.toggle());
    expect(hook.result.current).toMatchObject({ open: true, fresh: 0 });
    expect([...hook.result.current.newWhenOpened]).toEqual(["a", "b"]);
  });

  it("marks what came in while open as seen once it closes", () => {
    const hook = renderHook(({ events }) => useActivitySeen(events), { initialProps: { events: [ev("a")] } });
    act(() => hook.result.current.toggle());
    hook.rerender({ events: [ev("a"), ev("b")] });
    act(() => hook.result.current.close());
    expect(hook.result.current).toMatchObject({ open: false, fresh: 0 });
    hook.rerender({ events: [ev("a"), ev("b"), ev("c")] });
    expect(hook.result.current.fresh).toBe(1);
  });

  it("doesn't count an event that comes in while the list is open", () => {
    const hook = renderHook(({ events }) => useActivitySeen(events), { initialProps: { events: [ev("a")] } });
    act(() => hook.result.current.toggle());
    hook.rerender({ events: [ev("a"), ev("b")] });
    expect(hook.result.current.fresh).toBe(0);
  });

  it("gives the same answer while nothing changes", () => {
    const events = [ev("a")];
    const hook = renderHook(() => useActivitySeen(events));
    const first = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(first);
  });
});
