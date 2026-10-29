import { Track, type LocalAudioTrack, type LocalTrack } from "livekit-client";
import { isLocalAudio } from "./utils/track-kind.util";
import type { VoiceProblem } from "@core/devices/types/devices.types";
import type { VoicePrefs } from "@core/preferences/types/preferences.types";
import type { Gate, RoomContext } from "./types/livekit.types";
import { problemOf } from "./utils/voice-problem.util";
import { NoiseGate } from "./noise-gate.adapter";
import { micCaptureOptions } from "./utils/publish-options.util";

/** My voice: asked for only when I turn it on, sent alongside my stream, through the noise gate. */
export class VoiceService {
  private readonly ctx: RoomContext;
  private gate: Gate | null = null;

  constructor(ctx: RoomContext) {
    this.ctx = ctx;
  }

  async startVoice(prefs: VoicePrefs): Promise<VoiceProblem> {
    const room = this.ctx.room();
    if (!room) return null;
    let track: (LocalAudioTrack & LocalTrack) | undefined;
    try {
      [track] = (await room.localParticipant.createTracks({ audio: micCaptureOptions(prefs) })).filter(isLocalAudio);
    } catch (e) {
      return problemOf(e);
    }
    if (!track) return "missing";
    try {
      const raw = track.mediaStreamTrack;
      this.closeVoice();
      this.gate = await this.gateVoice(track, prefs.sensitivity);
      await room.localParticipant.publishTrack(track, { source: Track.Source.Microphone });
      this.ctx.refreshLocal({ micInput: this.gate?.gate.input ?? raw });
      return null;
    } catch {
      // Captured but not sent (the connection, or a token that doesn't allow it): the mic stops
      // at once, so the browser doesn't keep listening.
      track.stop();
      this.closeVoice();
      return "failed";
    }
  }

  async stopVoice() {
    const me = this.ctx.room()?.localParticipant;
    const track = this.sentMic();
    if (me && track) await me.unpublishTrack(track, true);
    this.closeVoice();
    this.ctx.refreshLocal({ micInput: undefined });
  }

  /** Another mic or other processing, on the same track, live. */
  async applyVoice(prefs: VoicePrefs) {
    const track = this.sentMic();
    if (!track) return;
    await track.restartTrack(micCaptureOptions(prefs));
    // Another mic: the meter follows it (the gate is handed the new one by LiveKit).
    this.ctx.update({ micInput: this.gate?.gate.input ?? track.mediaStreamTrack });
  }

  /** Moves the gate's line, live. */
  setVoiceLine(line: number) {
    this.gate?.gate.setLine(line);
  }

  /** Lets the gate's audio go. */
  closeVoice() {
    void this.gate?.context.close().catch(() => {});
    this.gate = null;
  }

  private sentMic() {
    const track = this.ctx.room()?.localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
    return isLocalAudio(track) ? track : undefined;
  }

  /**
   * My voice through the noise gate, with its own Web Audio context. Where the browser can't run
   * it, the voice is sent as the browser's processing leaves it: null.
   */
  private async gateVoice(track: LocalAudioTrack, line: number): Promise<Gate | null> {
    if (typeof AudioContext === "undefined" || typeof track.setProcessor !== "function") return null;
    const context = new AudioContext();
    try {
      // Made after the permission prompt, the click may no longer count: a suspended context
      // would send silence.
      if (context.state === "suspended") await context.resume();
      track.setAudioContext(context);
      const gate = new NoiseGate(line);
      await track.setProcessor(gate);
      return { gate, context };
    } catch {
      void context.close().catch(() => {});
      return null;
    }
  }
}
