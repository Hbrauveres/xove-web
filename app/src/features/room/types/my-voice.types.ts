import type { VoiceProblem } from "@services/media-devices-service/types/devices.types";
import type { VoicePrefs } from "@services/preferences-service/types/preferences.types";

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
