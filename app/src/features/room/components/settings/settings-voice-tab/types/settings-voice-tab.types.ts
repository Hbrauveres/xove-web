import type { MicDevice } from "@services/media-devices-service";
import type { MediaTrack } from "@services/livekit-service";
import type { VoicePrefs } from "@services/preferences-service";

/** A voice switch's setting: one of the processing flags. */
type VoiceSwitchKey = keyof Omit<VoicePrefs, "micId" | "sensitivity">;

/** A voice switch: what it turns on and off, its words and what it does. */
export type VoiceSwitch = { key: VoiceSwitchKey; label: string; hint: string };

export interface SettingsVoiceTabProps {
  /** The tab is the one shown: the level is read only then. */
  shown: boolean;
  prefs: VoicePrefs;
  onPrefs: (prefs: VoicePrefs) => void;
  mics: MicDevice[];
  /** My voice, sent: what Test plays back. */
  voice?: MediaTrack | undefined;
  /** The microphone itself, before the gate: what the level reads. */
  micInput?: MediaStreamTrack | undefined;
}
