/** The tracks: someone else's, the browser's own capture, and the ones this browser publishes. */
import { vi } from "vitest";
import { fakeCameras } from "./livekit-devices.fake";
import { Track } from "./livekit-enums.fake";
import { rooms } from "./livekit-rooms.fake";

export class FakeTrack {
  readonly attached: HTMLMediaElement[] = [];
  /** The browser's track: a voice's real sound where a test gives it one; a capture's for local tracks. */
  mediaStreamTrack?: MediaStreamTrack | FakeMediaStreamTrack;
  attach(element: HTMLMediaElement) {
    this.attached.push(element);
    return element;
  }
  /** As LiveKit's: the element lets go of the track's stream. */
  detach(element: HTMLMediaElement) {
    this.attached.splice(this.attached.indexOf(element), 1);
    element.srcObject = null;
    return element;
  }
}

/** The browser's captured screen, as a MediaStreamTrack. */
export class FakeMediaStreamTrack {
  contentHint = "";
  stopped = false;
  /** For a camera: which one. */
  readonly deviceId: string | undefined;
  /** For a picked screen: what was picked ("window", "browser" for a tab, "monitor"). */
  displaySurface?: string;
  constructor(deviceId?: string) {
    this.deviceId = deviceId;
  }
  getSettings() {
    return { deviceId: this.deviceId, displaySurface: this.displaySurface };
  }
  readonly listeners: (() => void)[] = [];
  addEventListener(event: string, listener: () => void) {
    if (event === "ended") this.listeners.push(listener);
  }
  removeEventListener(event: string, listener: () => void) {
    if (event === "ended") this.listeners.splice(this.listeners.indexOf(listener), 1);
  }
  /** The browser ended the capture (its own "Stop sharing" bar). */
  end() {
    this.stopped = true;
    for (const listener of [...this.listeners]) listener();
  }
  stop() {
    this.stopped = true;
  }
}

/** A track this browser captured: the screen, or its sound. */
export class FakeLocalTrack extends FakeTrack {
  override mediaStreamTrack: FakeMediaStreamTrack;
  readonly kind: "video" | "audio";
  source: string;
  stopped = false;
  constructor(kind: "video" | "audio", source: string, mediaStreamTrack = new FakeMediaStreamTrack()) {
    super();
    this.kind = kind;
    this.source = source;
    this.mediaStreamTrack = mediaStreamTrack;
  }
  stop() {
    this.stopped = true;
    this.mediaStreamTrack.stop();
  }
  /** Swaps the browser track under the same published track (LiveKit stops the old one). */
  readonly replaceTrack = vi.fn(async (mediaStreamTrack: FakeMediaStreamTrack, _options?: unknown) => {
    this.mediaStreamTrack.stop();
    this.mediaStreamTrack = mediaStreamTrack;
    return this;
  });
}

/** The captured screen. */
export class FakeLocalScreenTrack extends FakeLocalTrack {
  readonly setPublishingQuality = vi.fn();
  readonly setDegradationPreference = vi.fn(async () => undefined);
  constructor(mediaStreamTrack = new FakeMediaStreamTrack(), source: string = Track.Source.ScreenShare) {
    super("video", source, mediaStreamTrack);
  }
}

/** The captured camera: a video track like the screen's, from another source. */
export class FakeLocalCameraTrack extends FakeLocalScreenTrack {
  constructor(deviceId = fakeCameras[0]?.deviceId) {
    super(new FakeMediaStreamTrack(deviceId), Track.Source.Camera);
  }
  /** Captures again with new constraints: another camera, same published track. */
  readonly restartTrack = vi.fn(async (options?: { deviceId?: { exact?: string } }) => {
    this.mediaStreamTrack.stop();
    this.mediaStreamTrack = new FakeMediaStreamTrack(options?.deviceId?.exact ?? this.mediaStreamTrack.deviceId);
  });
}

/** My microphone: captured with its processing, published as my voice. */
export class FakeLocalMicTrack extends FakeLocalTrack {
  /** The capture's options, as the app asked (the mic picked, its processing). */
  options: unknown;
  constructor(options?: unknown) {
    super(
      "audio",
      Track.Source.Microphone,
      new FakeMediaStreamTrack((options as { deviceId?: string } | undefined)?.deviceId),
    );
    this.options = options;
  }
  /** Captures again with new options: another mic or other processing, same published track. */
  readonly restartTrack = vi.fn(async (options?: unknown) => {
    this.options = options;
  });
  /** The noise gate: its audio context, and the processor set on the track. */
  processor?: unknown;
  readonly setAudioContext = vi.fn();
  readonly setProcessor = vi.fn(async (processor: unknown) => {
    this.processor = processor;
  });
}

/** The screen's video, wrapped by the app after the browser's picker. */
export class LocalVideoTrack extends FakeLocalScreenTrack {
  constructor(mediaStreamTrack: FakeMediaStreamTrack) {
    super(mediaStreamTrack, Track.Source.Unknown);
    rooms.at(-1)?.localParticipant.lastCapture.push(this);
  }
}

/** The screen's sound, wrapped by the app after the browser's picker. */
export class LocalAudioTrack extends FakeLocalTrack {
  constructor(mediaStreamTrack: FakeMediaStreamTrack) {
    super("audio", Track.Source.Unknown, mediaStreamTrack);
    rooms.at(-1)?.localParticipant.lastCapture.push(this);
  }
}
