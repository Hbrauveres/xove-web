import { Track, type RemoteParticipant } from "livekit-client";
import { describe, expect, it, vi } from "vitest";
import type { RemoteMedia, RoomContext, VideoRoomState } from "./types/livekit.types";
import { SpeakingService } from "./speaking.service";
import type { VoiceActivity } from "./voice-activity.adapter";

/** A person whose voice publication the test shapes, and the room state the service changes. */
function setup() {
  const said = new Map<MediaStreamTrack, (on: boolean) => void>();
  const stopped = vi.fn();
  const activity = {
    watch: (track: MediaStreamTrack, onChange: (on: boolean) => void) => {
      said.set(track, onChange);
      return stopped;
    },
    resume: vi.fn(async () => {}),
    close: vi.fn(),
  } as unknown as VoiceActivity;
  const marina = { hasVoice: true, speaking: false } as RemoteMedia;
  let state = { remote: { "user-2": marina } } as unknown as VideoRoomState;
  const ctx = {
    state: () => state,
    update: (patch: Partial<VideoRoomState>) => (state = { ...state, ...patch }),
  } as unknown as RoomContext;
  vi.stubGlobal("AudioContext", class {});
  const voice = { isMuted: false, track: { mediaStreamTrack: {} as MediaStreamTrack } };
  const person = {
    identity: "user-2",
    getTrackPublication: (s: Track.Source) => (s === Track.Source.Microphone ? voice : undefined),
  } as unknown as RemoteParticipant;
  return {
    service: new SpeakingService(ctx, activity),
    said,
    stopped,
    voice,
    person,
    speaking: () => state.remote["user-2"]?.speaking,
    activity,
  };
}

describe("who's speaking among the others", () => {
  it("watches a voice I hear, and its sound sets their speaking", () => {
    const { service, said, voice, person, speaking } = setup();
    service.follow(person);
    said.get(voice.track.mediaStreamTrack)?.(true);
    expect(speaking()).toBe(true);
    expect(service.now().has("user-2")).toBe(true);
    said.get(voice.track.mediaStreamTrack)?.(false);
    expect(speaking()).toBe(false);
  });

  it("stops watching a voice muted by its person, and someone who leaves", () => {
    const { service, said, voice, person, stopped, speaking } = setup();
    service.follow(person);
    said.get(voice.track.mediaStreamTrack)?.(true);
    voice.isMuted = true;
    service.follow(person);
    expect(stopped).toHaveBeenCalledTimes(1);
    expect(speaking()).toBe(false);
    voice.isMuted = false;
    service.follow(person);
    service.forget("user-2");
    expect(stopped).toHaveBeenCalledTimes(2);
  });

  it("starts hearing with the room's sound, and lets everything go with the room", () => {
    const { service, person, stopped, activity } = setup();
    service.follow(person);
    service.resume();
    expect(activity.resume).toHaveBeenCalled();
    service.close();
    expect(stopped).toHaveBeenCalled();
    expect(activity.close).toHaveBeenCalled();
  });
});
