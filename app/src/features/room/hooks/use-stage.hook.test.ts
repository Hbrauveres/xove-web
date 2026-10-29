import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aSharer } from "../../../test/factories/sharer.factory";
import type { Sharer } from "../types/room-view.types";
import { useStage } from "./use-stage.hook";

describe("who is on my stage", () => {
  it("the longest sharing by default; a pick while that person shares; back to the longest when they stop", () => {
    const bruno = aSharer({ id: "user-7", name: "Bruno" });
    const ana = aSharer({ id: "user-3", name: "Ana" });
    const hook = renderHook(({ sharers }: { sharers: Sharer[] }) => useStage(sharers), {
      initialProps: { sharers: [bruno, ana] },
    });
    expect(hook.result.current.big?.person.id).toBe("user-7");

    act(() => hook.result.current.pick("user-3"));
    expect(hook.result.current.big?.person.id).toBe("user-3");

    hook.rerender({ sharers: [bruno] });
    hook.rerender({ sharers: [bruno, ana] });
    expect(hook.result.current.big?.person.id).toBe("user-7");
  });

  it("swaps a person's screen and camera, and picks one of their streams", () => {
    const both = aSharer({ id: "user-7", kinds: ["screen", "camera"] });
    const hook = renderHook(() => useStage([both]));
    expect(hook.result.current.mainKind).toBe("screen");

    act(() => hook.result.current.toggleSwap("user-7"));
    expect(hook.result.current.mainKind).toBe("camera");
    act(() => hook.result.current.pick("user-7", "screen"));
    expect(hook.result.current.mainKind).toBe("screen");
  });

  it("gives the same value while nothing changes", () => {
    const sharers = [aSharer()];
    const hook = renderHook(() => useStage(sharers));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
