import { Track, type LocalAudioTrack, type LocalTrack } from "livekit-client";
import { isLocalAudio } from "./utils/track-kind.util";
import type { VoiceProblem } from "@services/media-devices-service";
import type { VoicePrefs } from "@services/preferences-service";
import type { Gate, RoomContext } from "./types/livekit.types";
import { problemOf } from "./utils/voice-problem.util";
import { NoiseGate } from "./noise-gate.adapter";
import { VoiceActivity } from "./voice-activity.adapter";
import { micCaptureOptions } from "./utils/publish-options.util";

/** My voice: asked for only when I turn it on, sent alongside my stream, through the noise gate. */
export class VoiceService {
  private readonly ctx: RoomContext;
  private gate: Gate | null = null;
  /** Without the gate, my raw mic is measured for my speaking; how to stop that. */
  private ungated: (() => void) | null = null;
  private readonly activity: VoiceActivity;

  constructor(ctx: RoomContext, activity = new VoiceActivity()) {
    this.ctx = ctx;
    this.activity = activity;
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
      // Where the browser can't run the gate, my speaking is measured from the mic as sent.
      if (!this.gate && typeof AudioContext !== "undefined")
        this.ungated = this.activity.watch(raw, (on) => this.ctx.update({ voiceSpeaking: on }));
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

  /** Lets the gate's audio go: nothing of mine is sent, so I'm not speaking. */
  closeVoice() {
    // The old gate runs on until LiveKit lets it go: it no longer speaks for me.
    if (this.gate) delete this.gate.gate.onOpen;
    void this.gate?.context.close().catch(() => {});
    this.gate = null;
    this.ungated?.();
    this.ungated = null;
    this.activity.close();
    this.ctx.update({ voiceSpeaking: false });
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
      gate.onOpen = (open) => this.ctx.update({ voiceSpeaking: open });
      await track.setProcessor(gate);
      return { gate, context };
    } catch {
      void context.close().catch(() => {});
      return null;
    }
  }
}
