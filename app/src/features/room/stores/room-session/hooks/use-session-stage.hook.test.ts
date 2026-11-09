import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../../testing/factories/sharer.factory";
import type { RoomStoreValue } from "../types/room-store.types";
import type { SessionCore, SettingsOpen } from "../types/room-session.types";
import { useSessionStage } from "./use-session-stage.hook";

/** Bruno sharing; Ana and I watch him, Rafa watches nobody; I'm not in the video room yet. */
function setup() {
  const bruno = aSharer({ id: "bruno", name: "Bruno" });
  const me = { id: "me", name: "Henrique", hue: 210, online: true };
  const ana = { id: "ana", name: "Ana", hue: 90, online: true };
  const rafa = { id: "rafa", name: "Rafa", hue: 150, online: true };
  const report = vi.fn(() => Promise.resolve());
  const room = {
    store: { reportWatching: report },
    model: { watching: null, me: "me", seated: false },
    video: { connection: "connected", voice: true, voiceSpeaking: true, soundHeld: false },
  } as unknown as RoomStoreValue;
  const core = {
    sharers: [bruno],
    people: [me, bruno.person, ana, rafa],
    me,
    // Ana and I watch Bruno; Rafa watches nobody.
    watchingOf: { me: { sharerId: "bruno", kind: "screen" }, ana: { sharerId: "bruno", kind: "screen" } },
    mine: { screen: false, camera: false },
    places: 6,
    free: 5,
    cameras: [],
    cameraId: null,
  } as unknown as SessionCore;
  const settings: SettingsOpen = { open: true, toggle: vi.fn(), close: vi.fn(), goTo: undefined, goToSetting: vi.fn() };
  const light = { on: true, brightness: 0.9 };
  return { room, core, settings, light, report };
}

describe("the stage's part of the session", () => {
  it("puts the longest sharer on the stage, with who watches them and the others in the room", () => {
    const { room, core, settings, light } = setup();
    const { result } = renderHook(() => useSessionStage(room, core, settings, light));
    expect(result.current.stage.big?.person.id).toBe("bruno");
    expect(result.current.watchers.map((p) => p.id)).toEqual(["me", "ana"]);
    expect(result.current.others.map((p) => p.id)).toEqual(["bruno", "ana", "rafa"]);
  });

  it("gives my buttons the settings' state, my voice and my places", () => {
    const { room, core, settings, light } = setup();
    const { controls } = renderHook(() => useSessionStage(room, core, settings, light)).result.current;
    expect(controls).toMatchObject({ settingsOpen: true, voice: true, speaking: true, places: 6, free: 5 });
    expect(controls.onSettings).toBe(settings.toggle);
    expect(controls.onGoTo).toBe(settings.goToSetting);
  });

  it("tells the API nothing while I'm not in the room", () => {
    const { room, core, settings, light, report } = setup();
    renderHook(() => useSessionStage(room, core, settings, light));
    expect(report).not.toHaveBeenCalled();
  });

  it("gives the same value while nothing changes", () => {
    const { room, core, settings, light } = setup();
    const { result, rerender } = renderHook(() => useSessionStage(room, core, settings, light));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});
