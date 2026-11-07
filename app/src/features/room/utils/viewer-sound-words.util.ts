import type { HearSound, SoundKind } from "../types/sound.types";

/** One sound over the stream in words: its tooltip, its spoken name (what a click does, or why not), its slider's. */
export function viewerSoundWords(kind: SoundKind, s: HearSound, name = "") {
  const voice = `${name}'s voice`;
  const what = kind === "sound" ? "the screen's sound" : voice;
  return {
    tip: kind === "sound" ? "Screen sound" : voice,
    label: s.unavailable ?? `${s.muted ? "Unmute" : "Mute"} ${what}`,
    volume: kind === "sound" ? "Screen sound volume" : `${voice} volume`,
  };
}
