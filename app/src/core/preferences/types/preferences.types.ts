/** Whose sound I'm hearing: the stream I watch, or the voice of its person. */
export type HearingOf = "stream" | "voice";

/** How I hear a stream or a voice: its volume, 0 to 1, and mute. */
export type HearingPrefs = { volume: number; muted: boolean };

/** The light around the stage: on or off, and how bright, 0 to 1. */
export type AmbilightPrefs = { on: boolean; brightness: number };

/** How my voice is captured and sent: the mic picked, the browser's processing, the gate's line. */
export type VoicePrefs = {
  micId: string | null;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  voiceIsolation: boolean;
  /** The mic level's line, 0 to 1: sound under it isn't sent (the noise gate). */
  sensitivity: number;
};

/** The voice settings that are on or off. */
export type VoiceFlag = Exclude<keyof VoicePrefs, "micId" | "sensitivity">;
