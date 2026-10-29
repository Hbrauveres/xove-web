import { describe, expect, it } from "vitest";
import { roomEntry } from "../../utils/room-entry.util";

const connecting = () => ({ connection: "connecting" as const, error: null });

describe("entering the room", () => {
  it("waits with my place while I have no seat", () => {
    expect(roomEntry({ seat: { status: "waiting", place: 2 }, me: null }, connecting())).toEqual({
      ready: false,
      waiting: { status: "waiting", place: 2 },
    });
  });

  it("keeps looking for a seat while the room names me, then opens", () => {
    expect(roomEntry({ seat: { status: "in" }, me: null }, connecting())).toEqual({ ready: false, waiting: null });
    expect(roomEntry({ seat: { status: "in" }, me: "user-7" }, connecting()).ready).toBe(true);
  });

  it("opens without my name when the video access failed, to say why", () => {
    const failed = { connection: "disconnected" as const, error: "Video isn't set up on this server yet." };
    expect(roomEntry({ seat: { status: "in" }, me: null }, failed).ready).toBe(true);
  });
});
