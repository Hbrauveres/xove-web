/** Me in the room: what this browser captures and publishes, and the knobs a test turns to play the browser. */
import { vi } from "vitest";
import { fakeCameras } from "./livekit-devices.fake";
import { RoomEvent, Track } from "./livekit-enums.fake";
import { nextPublishNumber } from "./livekit-rooms.fake";
import {
  FakeLocalCameraTrack,
  FakeLocalMicTrack,
  FakeLocalScreenTrack,
  FakeLocalTrack,
  FakeMediaStreamTrack,
} from "./livekit-tracks.fake";

type Emit = (event: string, ...args: unknown[]) => void;

/** My own participant in a room; `emit` tells the room's listeners what I published. */
export function localParticipantOf(emit: Emit) {
  const local = {
    sid: "PA_me",
    /** The screen tracks this browser publishes. */
    screens: [] as { trackSid: string | undefined; track: FakeLocalScreenTrack; options?: unknown }[],
    /** Published with the screen when the picker gave sound. */
    screenAudio: null as { trackSid: string; track: FakeLocalTrack; options?: unknown } | null,
    /** The camera this browser publishes. */
    camera: null as { trackSid: string; track: FakeLocalCameraTrack; options?: unknown } | null,
    /** My voice, while it's on. */
    mic: null as { trackSid: string; track: FakeLocalMicTrack; options?: unknown } | null,
    /** Tests set this to an error name to play the microphone refused or missing. */
    nextMic: "allow" as "allow" | "NotAllowedError" | "NotFoundError",
    /** Tests set this to an error name ("NotAllowedError", "NotFoundError") to play the camera refused or missing. */
    nextCamera: "allow" as "allow" | "NotAllowedError" | "NotFoundError",
    /** The last camera captured (whether it was published or not). */
    lastCamera: null as FakeLocalCameraTrack | null,
    get isScreenShareEnabled() {
      return this.screens.length > 0;
    },
    /** Tests set this to undefined to play LiveKit not reporting the screen track. */
    screenTrackSid: "TR_my_screen" as string | undefined,
    /** Tests set this to false to play a browser or surface that gives no sound. */
    nextPickerAudio: true,
    /**
     * Tests set this to "cancel" to play someone closing the browser's picker, "no-video" for a
     * capture without a screen.
     */
    nextPicker: "share" as "share" | "cancel" | "no-video",
    /** Tests set this to play something happening while the picker is open. */
    duringPicker: undefined as (() => void) | undefined,
    /** What the next pick is: a window, a tab ("browser") or the whole screen ("monitor"). */
    nextSurface: "window" as string,
    /** The browser tracks the last pick gave. */
    lastPicked: [] as FakeMediaStreamTrack[],
    /** The last screen captured (whether it was published or not). */
    lastCapture: [] as FakeLocalTrack[],
    getTrackPublication: (source: string) => {
      if (source === Track.Source.ScreenShare) return local.screens[0];
      if (source === Track.Source.ScreenShareAudio) return local.screenAudio ?? undefined;
      if (source === Track.Source.Camera) return local.camera ?? undefined;
      if (source === Track.Source.Microphone) return local.mic ?? undefined;
      return undefined;
    },
    /** The camera (never asked with a microphone by the app: tests check `audio: false`). */
    createTracks: vi.fn(async (_options?: { video?: unknown; audio?: unknown }) => {
      // The microphone alone: my voice, never with the camera.
      if (_options?.audio && !_options.video) {
        if (local.nextMic !== "allow") throw new DOMException("No microphone", local.nextMic);
        return [new FakeLocalMicTrack(_options.audio)];
      }
      if (local.nextCamera !== "allow") throw new DOMException("No camera", local.nextCamera);
      // `ideal`: a camera that's gone falls back to the first one.
      const wanted = (_options?.video as { deviceId?: { ideal?: string } } | undefined)?.deviceId?.ideal;
      local.lastCamera = new FakeLocalCameraTrack(fakeCameras.find((c) => c.deviceId === wanted)?.deviceId);
      return [local.lastCamera];
    }),
    /**
     * The browser's picker (`navigator.mediaDevices.getDisplayMedia`, see setup.ts):
     * captures the screen (and its sound), sends nothing yet.
     */
    getDisplayMedia: vi.fn(async (_request?: unknown) => {
      if (local.nextPicker === "cancel") throw new DOMException("Permission denied", "NotAllowedError");
      local.lastCapture = [];
      const video = local.nextPicker === "no-video" ? [] : [new FakeMediaStreamTrack()];
      for (const v of video) v.displaySurface = local.nextSurface;
      const audio = local.nextPickerAudio ? [new FakeMediaStreamTrack()] : [];
      local.lastPicked = [...video, ...audio];
      local.duringPicker?.();
      return { getVideoTracks: () => video, getAudioTracks: () => audio, getTracks: () => [...video, ...audio] };
    }),
    publishTrack: vi.fn(async (track: FakeLocalTrack, options?: unknown) => {
      if (track instanceof FakeLocalMicTrack) {
        local.mic = { trackSid: "TR_my_voice", track, options };
        emit(RoomEvent.LocalTrackPublished);
        return local.mic;
      }
      if (track instanceof FakeLocalCameraTrack) {
        local.camera = { trackSid: "TR_my_camera", track, options };
        emit(RoomEvent.LocalTrackPublished);
        return local.camera;
      }
      if (track instanceof FakeLocalScreenTrack) {
        const publication = {
          trackSid: local.screens.length === 0 ? local.screenTrackSid : `TR_my_screen_${nextPublishNumber()}`,
          track,
          options,
        };
        local.screens.push(publication);
        emit(RoomEvent.LocalTrackPublished);
        return publication;
      }
      local.screenAudio = { trackSid: "TR_my_sound", track, options };
      emit(RoomEvent.LocalTrackPublished);
      return local.screenAudio;
    }),
    unpublishTrack: vi.fn(async (track: FakeLocalTrack) => {
      local.screens = local.screens.filter((s) => s.track !== track);
      if (local.screenAudio?.track === track) local.screenAudio = null;
      if (local.camera?.track === track) local.camera = null;
      if (local.mic?.track === track) local.mic = null;
      track.stop();
      emit(RoomEvent.LocalTrackUnpublished);
      return undefined;
    }),
    setScreenShareEnabled: vi.fn(async (enabled: boolean) => {
      if (!enabled) {
        for (const s of local.screens) s.track.stop();
        local.screenAudio?.track.stop();
        local.screens = [];
        local.screenAudio = null;
        emit(RoomEvent.LocalTrackUnpublished);
      }
      return undefined;
    }),
  };
  return local;
}
