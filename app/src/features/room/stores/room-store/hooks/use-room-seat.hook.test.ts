import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { installFakeApi, aUser } from "../../../../../testing/fakeApi";
import { initialRoom } from "../room.model";
import { RoomStore } from "../room.store";
import { useRoomSeat } from "./use-room-seat.hook";

describe("my seat", () => {
  it("gives the seat with its actions, sent to the store", () => {
    installFakeApi({ me: aUser({ status: "MEMBER" }) });
    const store = new RoomStore("Henrique", 60_000);
    const accept = vi.spyOn(store, "accept").mockResolvedValue(undefined);
    const model = { ...initialRoom(), seat: { status: "waiting" as const, place: 2 } };
    const hook = renderHook(() => useRoomSeat(store, model));
    expect(hook.result.current.status).toEqual({ status: "waiting", place: 2 });
    hook.result.current.accept();
    expect(accept).toHaveBeenCalled();
  });

  it("gives the same value while nothing changes", () => {
    installFakeApi({ me: aUser({ status: "MEMBER" }) });
    const store = new RoomStore("Henrique", 60_000);
    const model = initialRoom();
    const hook = renderHook(() => useRoomSeat(store, model));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
