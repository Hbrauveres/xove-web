import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { aRoomSession } from "../../../../../testing/factories/room-session.factory";
import { RoomSessionContext, useRoomSession } from "./use-room-session.hook";

describe("reading the room's session", () => {
  it("gives the session the room shares", () => {
    const session = aRoomSession({ error: "The room is unreachable" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RoomSessionContext.Provider value={session}>{children}</RoomSessionContext.Provider>
    );
    const { result } = renderHook(() => useRoomSession(), { wrapper });
    expect(result.current).toBe(session);
  });

  it("refuses to run outside the room", () => {
    expect(() => renderHook(() => useRoomSession())).toThrow(/inside <RoomSessionProvider>/);
  });
});
