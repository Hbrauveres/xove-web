import type { VoiceSwitch } from "../types/settings-voice-tab.types";

/** The voice's processing switches, in order, each with what it does. */
export const VOICE_SWITCHES: VoiceSwitch[] = [
  { key: "echoCancellation", label: "Echo cancellation", hint: "Stops your speakers coming back through the mic" },
  { key: "noiseSuppression", label: "Noise suppression", hint: "Quiets fans, keyboards and hum" },
  { key: "autoGainControl", label: "Automatic volume", hint: "Keeps your voice at an even level" },
  { key: "voiceIsolation", label: "Voice isolation", hint: "Keeps only speech" },
];

/** Voice isolation is only in recent Chrome: elsewhere its switch is greyed with this. */
export const NO_ISOLATION = "This browser can't isolate a voice";

/** The toast's icon, when a switch can't be used. */
export const TOAST_ICON_SIZE = 20;
