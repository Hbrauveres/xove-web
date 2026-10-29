import { Track, type Room } from "livekit-client";
import type { SharingConnection, StreamKind, StreamSettings } from "@services/xove-api-service/types/api.types";
import { startFailed } from "./utils/capture.util";
import { COULDNT, NOT_CONNECTED, SOURCE } from "./constants/livekit.constants";
import type { Capture, CapturedTracks, RoomContext, StartedStream, WithMediaTrack } from "./types/livekit.types";
import {
  cameraCaptureOptions,
  cameraPublishOptions,
  capOf,
  contentHintOf,
  degradationOf,
  screenPublishOptions,
} from "./utils/publish-options.util";
import { isLocalVideo } from "./utils/track-kind.util";

/** Sends, adjusts and stops my screen and camera. */
export class SendService {
  private readonly ctx: RoomContext;

  constructor(ctx: RoomContext) {
    this.ctx = ctx;
  }

  /** The track of mine being sent for a kind. */
  sent(kind: StreamKind) {
    const track = this.ctx.room()?.localParticipant.getTrackPublication(SOURCE[kind])?.track;
    return isLocalVideo(track) ? track : undefined;
  }

  /** Sends a capture with its settings. Null, with the reason in the state, when it couldn't. */
  async publish(capture: Capture, prefs: StreamSettings): Promise<StartedStream | null> {
    const room = this.ctx.room();
    const tracks = this.ctx.captures.get(capture);
    if (!room || !tracks) {
      tracks?.video.stop();
      tracks?.audio?.stop();
      this.ctx.update({ error: NOT_CONNECTED });
      return null;
    }
    try {
      const started = await this.send(room, capture.kind, tracks, prefs);
      if (started) return started;
      // The API needs both ids to end the stream when it stops.
      await this.stop(capture.kind);
    } catch {
      await this.stop(capture.kind);
      tracks.video.stop();
      tracks.audio?.stop();
    }
    this.ctx.update({ error: startFailed(capture.kind) });
    return null;
  }

  private async send(room: Room, kind: StreamKind, tracks: CapturedTracks, prefs: StreamSettings) {
    const me = room.localParticipant;
    const options = kind === "screen" ? screenPublishOptions(prefs.mode) : cameraPublishOptions(prefs.mode);
    tracks.video.mediaStreamTrack.contentHint = contentHintOf(prefs.mode);
    const video = await me.publishTrack(tracks.video, { ...options, source: SOURCE[kind] });
    if (tracks.audio) await me.publishTrack(tracks.audio, { ...options, source: Track.Source.ScreenShareAudio });
    tracks.video.setPublishingQuality(capOf(prefs.quality));
    if (kind === "camera") this.watchCameraEnd(tracks.video);
    this.ctx.refreshLocal();
    if (!me.sid || !video.trackSid) return null;
    return { participantSid: me.sid, trackSid: video.trackSid, hasSound: tracks.audio !== undefined };
  }

  async stop(kind: StreamKind) {
    const room = this.ctx.room();
    if (!room) return;
    if (kind === "screen") {
      await room.localParticipant.setScreenShareEnabled(false);
    } else {
      // Turning a camera off unpublishes it (LiveKit's own "disable" only mutes it), so the API
      // hears that the stream ended.
      const track = this.sent("camera");
      if (track) await room.localParticipant.unpublishTrack(track, true);
    }
    this.ctx.refreshLocal();
  }

  /** A new quality or mode, live. */
  async applySettings(kind: StreamKind, prefs: StreamSettings) {
    const track = this.sent(kind);
    if (!track) return;
    track.mediaStreamTrack.contentHint = contentHintOf(prefs.mode);
    // Viewers' apps also stop asking for more than the cap (they read it from the API), so
    // LiveKit stops sending the layers above it (dynacast).
    track.setPublishingQuality(capOf(prefs.quality));
    await track.setDegradationPreference(degradationOf(prefs.mode)).catch(() => {
      /* An older browser keeps the previous preference; the content hint still applies. */
    });
  }

  /**
   * Sends the same published camera from another device: no stop for viewers or the API. On
   * failure, back to the previous camera, or the camera stops. True when it switched.
   */
  async pickCamera(deviceId: string, prefs: StreamSettings): Promise<boolean> {
    const track = this.sent("camera");
    if (!track) return false;
    const previous = track.mediaStreamTrack.getSettings().deviceId;
    // A new browser track needs the stream's mode again, and the watch for its end.
    const restartOn = async (id: string) => {
      await track.restartTrack({ ...cameraCaptureOptions(), deviceId: { exact: id } });
      this.watchCameraEnd(track);
      await this.applySettings("camera", prefs);
    };
    this.ctx.update({ error: null });
    const switched = await restartOn(deviceId).then(
      () => true,
      () => false,
    );
    if (!switched) {
      // LiveKit stopped the old camera before asking for the new one: go back to it, or stop
      // sending a camera that shows nothing.
      this.ctx.update({ error: COULDNT.switchCamera });
      await (previous ? restartOn(previous) : Promise.reject(new Error("no previous camera"))).catch(() =>
        this.stop("camera"),
      );
    }
    this.ctx.refreshLocal();
    return switched;
  }

  /** Where a stream of mine comes from, for the API. */
  connectionOf(kind: StreamKind): SharingConnection | null {
    const me = this.ctx.room()?.localParticipant;
    const trackSid = me?.getTrackPublication(SOURCE[kind])?.trackSid;
    return me?.sid && trackSid ? { participantSid: me.sid, trackSid } : null;
  }

  participantSid() {
    return this.ctx.room()?.localParticipant.sid || undefined;
  }

  // The camera unplugged or taken by another app: stop sending it. Again after each switch,
  // since a switch gives the camera a new browser track.
  private watchCameraEnd(track: WithMediaTrack) {
    track.mediaStreamTrack.addEventListener("ended", () => void this.stop("camera"));
  }
}
