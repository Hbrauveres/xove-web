import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../test/factories/sharer.factory";
import { aTrack } from "../../../test/factories/track.factory";
import { useHearing } from "./use-hearing.hook";

/** Bruno on the stage and Ana in a preview, each sharing a screen with sound and talking. */
function twoSharers() {
  const switches = { "user-7": vi.fn(), "user-3": vi.fn() };
  const voices = { "user-7": vi.fn(), "user-3": vi.fn() };
  const sharer = (id: "user-7" | "user-3", name: string) =>
    aSharer({
      id,
      name,
      hasSound: true,
      sound: aTrack(),
      setSoundOn: switches[id],
      hasVoice: true,
      voice: aTrack(),
      setVoiceOn: voices[id],
    });
  return { sharers: [sharer("user-7", "Bruno"), sharer("user-3", "Ana")], switches, voices };
}

describe("what I hear", () => {
  it("hears the stage, downloads it always, and leaves a preview off and not downloaded", () => {
    const { sharers, switches } = twoSharers();
    const hook = renderHook(() => useHearing(sharers, "user-7"));

    expect(hook.result.current.hearOf("user-7").sound.muted).toBe(false);
    expect(hook.result.current.hearOf("user-3").sound.muted).toBe(true);
    expect(switches["user-7"]).toHaveBeenLastCalledWith(true);
    expect(switches["user-3"]).toHaveBeenLastCalledWith(false);
    expect(hook.result.current.previewSounds).toEqual([]);
  });

  it("turns a preview's sound on: it's downloaded and plays, at its own volume", () => {
    const { sharers, switches } = twoSharers();
    const hook = renderHook(() => useHearing(sharers, "user-7"));
    const ana = hook.result.current.hearOf("user-3");

    act(() => hook.result.current.setHear("user-3", { ...ana, sound: { volume: 0.4, muted: false } }));

    expect(switches["user-3"]).toHaveBeenLastCalledWith(true);
    expect(hook.result.current.previewSounds).toEqual([expect.objectContaining({ id: "user-3", volume: 0.4 })]);
  });

  it("keeps each person's switch wherever they are", () => {
    const { sharers } = twoSharers();
    const hook = renderHook(({ big }) => useHearing(sharers, big), { initialProps: { big: "user-7" } });
    const ana = hook.result.current.hearOf("user-3");
    act(() => hook.result.current.setHear("user-3", { ...ana, voice: { ...ana.voice, muted: false } }));

    hook.rerender({ big: "user-3" });
    hook.rerender({ big: "user-7" });

    expect(hook.result.current.hearOf("user-3").voice.muted).toBe(false);
  });

  it("remembers the stage's volume as where the next person starts; a preview's never moves it", () => {
    const { sharers } = twoSharers();
    const hook = renderHook(() => useHearing(sharers, "user-7"));
    const bruno = hook.result.current.hearOf("user-7");
    act(() => hook.result.current.setHear("user-7", { ...bruno, sound: { volume: 0.3, muted: false } }));
    const ana = hook.result.current.hearOf("user-3");
    act(() => hook.result.current.setHear("user-3", { ...ana, sound: { volume: 0.9, muted: false } }));

    expect(localStorage.getItem("xove.watch.volume")).toBe("0.3");
    expect(hook.result.current.stageSound.volume).toBe(0.3);
  });

  it("gives the same value while nothing changes", () => {
    const { sharers } = twoSharers();
    const hook = renderHook(() => useHearing(sharers, "user-7"));
    const before = hook.result.current;
    hook.rerender();
    expect(hook.result.current).toBe(before);
  });
});
