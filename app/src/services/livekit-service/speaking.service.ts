import { Track, type RemoteParticipant } from "livekit-client";
import type { RoomContext } from "./types/livekit.types";
import { withSpeakers } from "./utils/room-state.util";
import { VoiceActivity } from "./voice-activity.adapter";

/**
 * Who's speaking among the others, measured from the voices this browser hears: each
 * heard voice is watched while it's downloaded and on; its on/off is the person's `speaking`.
 */
export class SpeakingService {
  private readonly ctx: RoomContext;
  private readonly activity: VoiceActivity;
  private readonly watched = new Map<string, { track: MediaStreamTrack; stop: () => void }>();
  private readonly speaking = new Set<string>();

  constructor(ctx: RoomContext, activity = new VoiceActivity()) {
    this.ctx = ctx;
    this.activity = activity;
  }

  /** Who's speaking now. */
  now(): ReadonlySet<string> {
    return this.speaking;
  }

  /** Follows someone's voice: watched while I hear it, not otherwise. */
  follow(p: RemoteParticipant) {
    const publication = p.getTrackPublication(Track.Source.Microphone);
    const heard = publication && !publication.isMuted ? publication.track?.mediaStreamTrack : undefined;
    const was = this.watched.get(p.identity);
    if (was?.track === heard) return;
    this.forget(p.identity);
    if (!heard || typeof AudioContext === "undefined") return;
    this.watched.set(p.identity, { track: heard, stop: this.activity.watch(heard, (on) => this.set(p.identity, on)) });
  }

  /** Stops watching someone (they left, or their voice went). */
  forget(identity: string) {
    this.watched.get(identity)?.stop();
    this.watched.delete(identity);
    this.set(identity, false);
  }

  /** Lets the measuring hear, with the room's sound (the first click). */
  resume() {
    void this.activity.resume();
  }

  /** Stops everything, with the room. */
  close() {
    for (const identity of [...this.watched.keys()]) this.forget(identity);
    this.activity.close();
  }

  private set(identity: string, on: boolean) {
    if (on === this.speaking.has(identity)) return;
    if (on) this.speaking.add(identity);
    else this.speaking.delete(identity);
    this.ctx.update({ remote: withSpeakers(this.ctx.state().remote, this.speaking) });
  }
}
