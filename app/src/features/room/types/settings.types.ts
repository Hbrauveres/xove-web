import type { CameraDevice, CameraProblem, MicDevice, ScreenSurface } from "@services/media-devices-service";
import type { MediaTrack } from "@services/livekit-service";
import type { VoicePrefs } from "@services/preferences-service";
import type { StreamKind, StreamSettings } from "@services/xove-api-service";

/** A setting a live button's gesture asked for, with the panel open; the counter makes a repeat count. */
export type SettingsGoTo = { kind: StreamKind; n: number };

/** What the room session gives the settings: what I send and how, my devices, and my voice. */
export type SettingsSession = {
  open: boolean;
  onClose: () => void;
  /** False where the browser can't share a screen: the Screen tab is greyed out. */
  screenTab: boolean;
  /** Which of my streams are live. */
  mine: Record<StreamKind, boolean>;
  prefs: Record<StreamKind, StreamSettings>;
  onPrefsChange: (kind: StreamKind, prefs: StreamSettings) => void;
  /** What my screen share shows. */
  screenSurface?: ScreenSurface | undefined;
  onChangeWindow: () => void;
  cameras: CameraDevice[];
  cameraId: string | null;
  onPickCamera: (deviceId: string) => void;
  /** My camera: the one being sent, or the preview's. */
  cameraVideo?: MediaTrack | undefined;
  /** Turns the camera on for the preview only, or off again. */
  onPreviewCamera: (on: boolean) => void;
  /** The camera was refused or there's none: said in the preview's place. */
  cameraProblem?: CameraProblem | undefined;
  busy?: boolean | undefined;
  /** I'm sharing my screen without sound: the Screen tab says how to share it. */
  noSound?: boolean | undefined;
  /** A live button's gesture with the panel open: go to this setting and cue it. */
  goTo?: SettingsGoTo | undefined;
  /** My voice: on or off, how it's captured, the mics, and its own track for the level. */
  voice?: boolean | undefined;
  voicePrefs?: VoicePrefs | undefined;
  onVoicePrefs?: ((prefs: VoicePrefs) => void) | undefined;
  mics?: MicDevice[] | undefined;
  localVoice?: MediaTrack | undefined;
  /** The microphone itself, before the gate: what the level meter reads. */
  micInput?: MediaStreamTrack | undefined;
};

/** A stream's quality and mode in the settings: its values, the change, and whether one is under way. */
export type SettingsStream = {
  prefs: StreamSettings;
  onChange: (prefs: StreamSettings) => void;
  busy?: boolean | undefined;
};

/** The settings' tabs. */
export type SettingsTab = "screen" | "camera" | "voice";

/** A setting cued in a tab: which tab, and the request it's cued for. */
export type SettingsCue = { kind: SettingsTab; n: number };
