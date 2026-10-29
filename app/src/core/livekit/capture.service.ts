import { LocalVideoTrack, Track, type Room } from "livekit-client";
import type { StreamKind, StreamMode } from "@core/api/types/api.types";
import { CAMERA_BLOCKED, CAMERA_MISSING } from "@core/devices/constants/devices.constants";
import { pickScreen } from "@core/devices/screen-picker.service";
import { isDomError, startFailed } from "./utils/capture.util";
import { screenSound } from "./screen-sound.service";
import { NOT_CONNECTED } from "./constants/livekit.constants";
import type { Capture, CapturedTracks, RoomContext } from "./types/livekit.types";
import { cameraCaptureOptions, contentHintOf } from "./utils/publish-options.util";
import { isLocalVideo } from "./utils/track-kind.util";

/** Captures a screen or a camera without sending it: the person is still choosing how. */
export class CaptureService {
  private readonly ctx: RoomContext;

  constructor(ctx: RoomContext) {
    this.ctx = ctx;
  }

  /**
   * Opens the browser's screen picker, or asks for the camera (`cameraId`, or the browser's
   * default). Null if the person closed the picker or refused.
   */
  async capture(kind: StreamKind, mode: StreamMode, cameraId: string | null = null): Promise<Capture | null> {
    const room = this.ctx.room();
    if (!room) {
      this.ctx.update({ error: NOT_CONNECTED });
      return null;
    }
    try {
      this.ctx.update({ error: null });
      // Always the best quality: the sharer can lower it, or raise it back, while sharing.
      const tracks =
        kind === "screen" ? await this.captureScreen(room, mode) : await this.captureCamera(room, cameraId);
      if (!tracks) {
        this.ctx.update({ error: startFailed(kind) });
        return null;
      }
      if (kind === "camera") this.ctx.update({ cameraProblem: null });
      return this.handle(kind, tracks);
    } catch (e) {
      this.problem(kind, e);
      return null;
    }
  }

  /** Stops a capture that won't be sent. */
  discard(capture: Capture) {
    const tracks = this.ctx.captures.get(capture);
    tracks?.video.stop();
    tracks?.audio?.stop();
  }

  private handle(kind: StreamKind, tracks: CapturedTracks): Capture {
    const capture: Capture = {
      kind,
      preview: tracks.video,
      hasSound: tracks.audio !== undefined,
      onEnded: (callback) => {
        const raw = tracks.video.mediaStreamTrack;
        raw.addEventListener("ended", callback);
        return () => raw.removeEventListener("ended", callback);
      },
    };
    this.ctx.captures.set(capture, tracks);
    return capture;
  }

  private problem(kind: StreamKind, e: unknown) {
    // Closing the browser's picker is a choice, not an error; a blocked camera needs a hint.
    if (isDomError(e, "NotAllowedError")) {
      if (kind === "camera") this.ctx.update({ error: CAMERA_BLOCKED, cameraProblem: "blocked" });
    } else if (kind === "camera" && isDomError(e, "NotFoundError")) {
      this.ctx.update({ error: CAMERA_MISSING, cameraProblem: "missing" });
    } else {
      this.ctx.update({ error: startFailed(kind) });
    }
  }

  /** The browser's screen picker, asked directly because livekit-client drops `windowAudio`. */
  private async captureScreen(room: Room, mode: StreamMode): Promise<CapturedTracks | null> {
    const stream = await pickScreen();
    const [screen] = stream.getVideoTracks();
    const [sound] = stream.getAudioTracks();
    if (!screen) {
      stream.getTracks().forEach((t) => t.stop());
      return null;
    }
    screen.contentHint = contentHintOf(mode);
    const video = new LocalVideoTrack(screen, undefined, false);
    video.source = Track.Source.ScreenShare;
    if (!isLocalVideo(video)) return null;
    if (!sound) return { video };
    // LiveKit unlocks the page's sound here too, while the sharer's click still counts.
    void room.startAudio();
    return { video, audio: screenSound(sound) };
  }

  private async captureCamera(room: Room, deviceId: string | null): Promise<CapturedTracks | null> {
    const tracks = await room.localParticipant.createTracks({ video: cameraCaptureOptions(deviceId), audio: false });
    const video = tracks.find(isLocalVideo);
    if (!video) tracks.forEach((t) => t.stop());
    return video ? { video } : null;
  }
}
