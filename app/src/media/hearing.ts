/** One sound as I hear it: its volume and whether it's off. */
export type Level = { volume: number; muted: boolean };
/** What I hear from one person: their screen's sound and their voice. */
export type Heard = { sound: Level; voice: Level };
/** What I chose for one person: each volume, and each switch once I touched it. */
export type Choices = { sound: { volume: number; muted?: boolean }; voice: { volume: number; muted?: boolean } };

/**
 * What I hear from a person (spec 0131, FR-1): one switch per sound that follows them everywhere
 * once I touch it; untouched, heard while they're on the stage and off while they're small. Each
 * volume is theirs once set, else my last one.
 */
export function hearingOf(mine: Choices | undefined, onStage: boolean, defaults: { sound: number; voice: number }): Heard {
  return {
    sound: { volume: mine?.sound.volume ?? defaults.sound, muted: mine?.sound.muted ?? !onStage },
    voice: { volume: mine?.voice.volume ?? defaults.voice, muted: mine?.voice.muted ?? !onStage },
  };
}

/** My choices after a change: only a switch that changed becomes mine; the other stays untouched. */
export function choose(mine: Choices | undefined, was: Heard, next: Heard): Choices {
  const pick = (kind: "sound" | "voice") => ({
    volume: next[kind].volume,
    muted: next[kind].muted !== was[kind].muted ? next[kind].muted : mine?.[kind].muted,
  });
  return { sound: pick("sound"), voice: pick("voice") };
}
