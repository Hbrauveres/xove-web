import type { CameraDevice, ScreenSurface } from "@services/media-devices-service";
import type { StreamKind } from "@services/xove-api-service";

/** What the room passes on to my buttons: my streams, the room's places, and what to do. */
export type StreamControls = {
  /** Which of my streams are live. */
  mine: Record<StreamKind, boolean>;
  /** How many streams can be live at once. */
  places: number;
  /** Stream places left. */
  free: number;
  /** The browser's cameras, and the one in use. */
  cameras: CameraDevice[];
  camera: string | null;
  /** False where the browser can't share a screen: its button is greyed out, not hidden. */
  canShareScreen: boolean;
  /** I'm sharing my screen, but my browser gave no sound. */
  noSound?: boolean;
  /** What my screen share shows: a window, a tab or the whole screen. */
  screenSurface?: ScreenSurface;
  /** A request is on its way: the buttons wait. */
  busy?: boolean;
  onStart: (kind: StreamKind) => void;
  onStop: (kind: StreamKind) => void;
  onChangeWindow: () => void;
  onPickCamera: (deviceId: string) => void;
  /** The settings panel is open; the cog opens and closes it. */
  settingsOpen: boolean;
  onSettings: () => void;
  /** My voice is on, and turning it on or off. */
  voice?: boolean;
  /** My voice is being sent right now (it passes the gate): my mic button wears the speaking cue. */
  speaking?: boolean;
  /** The browser holds the room's sound back until the page's first click or key. */
  soundHeld?: boolean;
  onVoice?: () => void;
  /** With the settings open, a live button's gesture goes to its setting there. */
  onGoTo?: (kind: StreamKind) => void;
};
