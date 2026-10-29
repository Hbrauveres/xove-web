import type { VoiceProblem } from "@core/devices/types/devices.types";
import type { VoicePrefs } from "@core/preferences/types/preferences.types";

export type MyVoiceInputs = {
  /** My voice is being sent. */
  voice: boolean;
  /** My screen or my camera is being sent: a voice never travels alone. */
  sending: boolean;
  startVoice: (prefs: VoicePrefs) => Promise<VoiceProblem>;
  stopVoice: () => Promise<void>;
  applyVoice: (prefs: VoicePrefs) => Promise<void>;
  setVoiceLine: (line: number) => void;
};
