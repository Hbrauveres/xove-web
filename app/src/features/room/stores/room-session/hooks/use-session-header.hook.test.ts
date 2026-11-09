import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aRoomSession, aStagePick } from "../../../../../testing/factories/room-session.factory";
import { aSharer } from "../../../../../testing/factories/sharer.factory";
import type { SessionCore } from "../types/room-session.types";
import { useSessionHeader } from "./use-session-header.hook";

/** Bruno sharing his screen, me watching, my voice sent; my account an admin's. */
function setup() {
  const bruno = aSharer({ id: "bruno", name: "Bruno", kinds: ["screen"] });
  const me = { id: "me", name: "Henrique", hue: 210, online: true };
  const core = {
    sharers: [bruno],
    activity: [],
    knownPeople: [me, bruno.person],
    people: [me, bruno.person],
    me,
    watchingOf: {},
    seats: null,
    video: { connection: "connected", voiceSpeaking: true },
  } as unknown as SessionCore;
  const account = { isAdmin: true, onSignOut: vi.fn() };
  const light = { value: { on: true, brightness: 0.9 }, change: vi.fn() };
  return { bruno, me, core, account, light };
}

describe("the header's part of the session", () => {
  it("says who shares what, and what's on my stage, for the activity and the people", () => {
    const { bruno, core, account, light } = setup();
    const stage = aRoomSession({ stage: { stage: aStagePick({ big: bruno, mainKind: "screen" }) } }).stage;
    const { result } = renderHook(() => useSessionHeader(core, stage, account, light));
    const { activity, people } = result.current;
    expect(activity.isLive("bruno", "screen")).toBe(true);
    expect(activity.isLive("bruno", "camera")).toBe(false);
    expect(activity.watching).toEqual({ personId: "bruno", kind: "screen" });
    expect(people.sharing).toEqual({ bruno: { screen: true, camera: false } });
    expect(people.meTalking).toBe(true);
  });

  it("gives my account its menu: admin, the connection, the light and signing out", () => {
    const { me, core, account, light } = setup();
    const stage = aRoomSession().stage;
    const { result } = renderHook(() => useSessionHeader(core, stage, account, light));
    expect(result.current.me).toMatchObject({ me, isAdmin: true, connection: "connected", ambilight: light.value });
    expect(result.current.activity.watching).toBeNull();
  });

  it("gives the same value while nothing changes", () => {
    const { core, account, light } = setup();
    const stage = aRoomSession().stage;
    const { result, rerender } = renderHook(() => useSessionHeader(core, stage, account, light));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});
