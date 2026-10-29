import type { RemoteParticipant } from "livekit-client";
import { describe, expect, it } from "vitest";
import { Room } from "../../testing/fakeLiveKit";
import { RemoteMediaReader } from "./remote-media.adapter";

/** Someone in a fresh fake room, as LiveKit hands them over. */
function someone() {
  const room = new Room();
  const person = room.join("user-2", "Marina") as unknown as RemoteParticipant;
  return { room, person };
}

describe("reading what someone sends", () => {
  it("is nothing while they send nothing", () => {
    const { person } = someone();
    expect(new RemoteMediaReader().read(person)).toBeUndefined();
  });

  it("reads their screen, its sound and their voice, and whether they're talking", () => {
    const { room, person } = someone();
    room.publishScreen("user-2", { height: 1080, withSound: true, layers: 3 });
    room.publishVoice("user-2");
    room.setSpeaking("user-2", true);

    const media = new RemoteMediaReader().read(person)!;

    expect(media.screen).toMatchObject({ height: 1080, layers: 3 });
    expect(media).toMatchObject({ hasSound: true, hasVoice: true, speaking: true });
  });

  it("makes the same actions for the same publication, so an unchanged person stays equal", () => {
    const { room, person } = someone();
    room.publishScreen("user-2", { withSound: true });
    const reader = new RemoteMediaReader();

    const first = reader.read(person)!;
    const again = reader.read(person)!;

    expect(again.setSoundOn).toBe(first.setSoundOn);
    expect(again.screen?.setQuality).toBe(first.screen?.setQuality);
  });

  it("downloads their screen's sound only when asked, once", () => {
    const { room, person } = someone();
    room.publishScreen("user-2", { withSound: true });
    const media = new RemoteMediaReader().read(person)!;

    media.setSoundOn(false);
    media.setSoundOn(false);

    expect(room.soundPublication("user-2")?.setSubscribed).toHaveBeenCalledTimes(1);
  });
});
