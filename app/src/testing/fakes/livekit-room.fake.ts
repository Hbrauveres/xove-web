/** A fake LiveKit room: connecting, its events, the page's sound, and the other people, played by the tests. */
import { vi } from "vitest";
import { ConnectionState, RoomEvent, Track } from "./livekit-enums.fake";
import { localParticipantOf } from "./livekit-local-participant.fake";
import { FakeParticipant, remotePublication } from "./livekit-participant.fake";
import { rooms } from "./livekit-rooms.fake";
import { FakeTrack } from "./livekit-tracks.fake";

type Handler = (...args: unknown[]) => void;

export class Room {
  readonly remoteParticipants = new Map<string, FakeParticipant>();
  readonly handlers = new Map<string, Handler[]>();
  connectedWith: { url: string; token: string } | null = null;
  disconnected = false;

  readonly localParticipant = localParticipantOf((event, ...args) => this.emit(event, ...args));
  /**
   * Whether the browser lets the page play sound, as LiveKit knows it: unknown until a sound tried to
   * play; false while the browser holds it back (`holdSound`), true once `startAudio` lets it.
   */
  canPlaybackAudio: boolean | undefined = undefined;

  /** The browser refuses a sound the page tried to play (no click on the page yet). */
  holdSound() {
    this.canPlaybackAudio = false;
    this.emit(RoomEvent.AudioPlaybackStatusChanged, false);
  }

  /** Unlocks the page's sound (LiveKit's own, after a click): a held sound plays from then on. */
  readonly startAudio = vi.fn(async () => {
    if (this.canPlaybackAudio !== false) return;
    this.canPlaybackAudio = true;
    this.emit(RoomEvent.AudioPlaybackStatusChanged, true);
  });

  constructor() {
    rooms.push(this);
  }

  on(event: string, handler: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }

  emit(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args);
  }

  async connect(url: string, token: string) {
    this.connectedWith = { url, token };
    this.emit(RoomEvent.ConnectionStateChanged, ConnectionState.Connected);
  }

  async disconnect() {
    this.disconnected = true;
  }

  // ---- what other people do, driven by tests ----

  join(identity: string, name: string) {
    const p = new FakeParticipant(identity, name);
    this.remoteParticipants.set(identity, p);
    this.emit(RoomEvent.ParticipantConnected, p);
    return p;
  }

  leave(identity: string) {
    const p = this.remoteParticipants.get(identity);
    this.remoteParticipants.delete(identity);
    this.emit(RoomEvent.ParticipantDisconnected, p);
  }

  /** `layers`: how many qualities the sharer sends (1 for Firefox and Safari sharers). */
  publishScreen(identity: string, options: { height?: number; withSound?: boolean; layers?: number } = {}) {
    const p = this.remoteParticipants.get(identity) ?? this.join(identity, identity);
    const track = new FakeTrack();
    p.tracks.set(Track.Source.ScreenShare, track);
    p.publications.set(Track.Source.ScreenShare, remotePublication(track, options.height ?? 1080, options.layers ?? 3));
    if (options.withSound) this.publishSound(identity);
    this.emit(RoomEvent.TrackSubscribed, track, {}, p);
    return track;
  }

  /** Someone's screen gets sound (they changed to a window or tab with sound). */
  publishSound(identity: string) {
    const p = this.remoteParticipants.get(identity) ?? this.join(identity, identity);
    const sound = new FakeTrack();
    const publication = remotePublication(sound);
    // Turning the sound off or on downloads it or not, like LiveKit does.
    publication.setSubscribed.mockImplementation((on: boolean) => {
      publication.isSubscribed = on;
      publication.track = on ? sound : undefined;
      this.emit(on ? RoomEvent.TrackSubscribed : RoomEvent.TrackUnsubscribed, sound, publication, p);
    });
    p.tracks.set(Track.Source.ScreenShareAudio, sound);
    p.publications.set(Track.Source.ScreenShareAudio, publication);
    this.emit(RoomEvent.TrackSubscribed, sound, publication, p);
    return sound;
  }

  /**
   * Someone turns on their voice: downloaded until this browser says otherwise; `sound`
   * is what it carries, where a test gives it real sound.
   */
  publishVoice(identity: string, sound?: MediaStreamTrack) {
    const p = this.remoteParticipants.get(identity) ?? this.join(identity, identity);
    const voice = new FakeTrack();
    if (sound) voice.mediaStreamTrack = sound;
    const publication = remotePublication(voice);
    publication.isMuted = false;
    publication.setSubscribed.mockImplementation((on: boolean) => {
      publication.isSubscribed = on;
      publication.track = on ? voice : undefined;
      this.emit(on ? RoomEvent.TrackSubscribed : RoomEvent.TrackUnsubscribed, voice, publication, p);
    });
    p.tracks.set(Track.Source.Microphone, voice);
    p.publications.set(Track.Source.Microphone, publication);
    this.emit(RoomEvent.TrackSubscribed, voice, publication, p);
    return voice;
  }

  /** Someone mutes or unmutes their voice. */
  muteVoice(identity: string, muted: boolean) {
    const p = this.remoteParticipants.get(identity);
    const publication = p?.publications.get(Track.Source.Microphone);
    if (!p || !publication) return;
    publication.isMuted = muted;
    if (muted) p.isSpeaking = false;
    this.emit(muted ? RoomEvent.TrackMuted : RoomEvent.TrackUnmuted, publication, p);
  }

  /** Someone starts or stops speaking (LiveKit's active speakers). */
  setSpeaking(identity: string, speaking: boolean) {
    const p = this.remoteParticipants.get(identity);
    if (!p || p.isSpeaking === speaking) return;
    p.isSpeaking = speaking;
    this.emit(
      RoomEvent.ActiveSpeakersChanged,
      [...this.remoteParticipants.values()].filter((x) => x.isSpeaking),
    );
  }

  /** Whether this browser downloads someone's voice. */
  voicePublication(identity: string) {
    return this.remoteParticipants.get(identity)?.publications.get(Track.Source.Microphone);
  }

  /** Someone turns on their camera: 720p with two layers unless said otherwise. */
  publishCamera(identity: string, options: { height?: number; layers?: number } = {}) {
    const p = this.remoteParticipants.get(identity) ?? this.join(identity, identity);
    const track = new FakeTrack();
    p.tracks.set(Track.Source.Camera, track);
    p.publications.set(Track.Source.Camera, remotePublication(track, options.height ?? 720, options.layers ?? 2));
    this.emit(RoomEvent.TrackSubscribed, track, {}, p);
    return track;
  }

  /** Someone stops a screen, its sound or a camera. */
  unpublish(identity: string, source: string) {
    const p = this.remoteParticipants.get(identity);
    if (!p) return;
    p.tracks.delete(source);
    p.publications.delete(source);
    this.emit(RoomEvent.TrackUnsubscribed, undefined, {}, p);
  }

  /** What this browser asked the server for, for someone's screen. */
  screenPublication(identity: string) {
    return this.remoteParticipants.get(identity)?.publications.get(Track.Source.ScreenShare);
  }

  /** What this browser asked the server for, for someone's camera. */
  cameraPublication(identity: string) {
    return this.remoteParticipants.get(identity)?.publications.get(Track.Source.Camera);
  }

  /** Whether this browser downloads someone's screen sound. */
  soundPublication(identity: string) {
    return this.remoteParticipants.get(identity)?.publications.get(Track.Source.ScreenShareAudio);
  }

  /** The person clicked the browser's own "Stop sharing" bar. */
  browserStopsMyShare() {
    const local = this.localParticipant;
    for (const track of local.lastCapture) track.mediaStreamTrack.end();
    local.screens = [];
    local.screenAudio = null;
    this.emit(RoomEvent.LocalTrackUnpublished);
  }
}
