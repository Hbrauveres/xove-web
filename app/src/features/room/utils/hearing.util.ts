import type { Choices, Heard } from "../types/hearing.types";

/**
 * What I hear from a person: one switch per sound that follows them everywhere
 * once I touch it; untouched, heard while they're on the stage and off while they're small. Each
 * volume is theirs once set, else my last one.
 */
export function hearingOf(
  mine: Choices | undefined,
  onStage: boolean,
  defaults: { sound: number; voice: number },
): Heard {
  return {
    sound: { volume: mine?.sound.volume ?? defaults.sound, muted: mine?.sound.muted ?? !onStage },
    voice: { volume: mine?.voice.volume ?? defaults.voice, muted: mine?.voice.muted ?? !onStage },
  };
}

/** My choices after a change: only a switch that changed becomes mine; the other stays untouched. */
export function choose(mine: Choices | undefined, was: Heard, next: Heard): Choices {
  const pick = (kind: "sound" | "voice") => {
    const muted = next[kind].muted !== was[kind].muted ? next[kind].muted : mine?.[kind].muted;
    return { volume: next[kind].volume, ...(muted === undefined ? {} : { muted }) };
  };
  return { sound: pick("sound"), voice: pick("voice") };
}

/**
 * Whether the page downloads a person's sound or voice: always the person on the stage's, muted or
 * not, so unmuting is instant; a preview's only while I hear it.
 */
export function downloads(mine: Choices | undefined, onStage: boolean, kind: "sound" | "voice"): boolean {
  return onStage || !hearingOf(mine, onStage, { sound: 0, voice: 0 })[kind].muted;
}
