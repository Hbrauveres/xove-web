/** A sound I hear from someone: their screen's sound or their voice. */
export type SoundKind = "sound" | "voice";

/** A sound slider's waits: the mouse resting, the mouse gone, and untouched. */
export type SliderTimer = "rest" | "leave" | "idle";

/** One sound I hear from someone: its volume and mute. */
export type Sound = { volume: number; muted: boolean };

/** One sound, as the viewer bar shows it: why it can't be heard, if so, and how to change it. */
export type HearSound = Sound & { unavailable?: string; onChange: (s: Sound) => void };

/** What I hear from one person: their screen's sound and their voice, each its own mute. */
export type Hearing = { sound: Sound; voice: Sound };
