import type { Sharer } from "../../../types/room-view.types";
import type { SoundKind } from "../../../types/sound.types";

/** One of a person's sounds in words: what it is, why it can't be heard, and what a click does. */
export function hearWords(sharer: Sharer, kind: SoundKind, muted: boolean) {
  const name = sharer.person.name;
  const what = kind === "sound" ? `${name}'s screen sound` : `${name}'s voice`;
  const unavailable =
    kind === "sound"
      ? sharer.screen && sharer.hasSound
        ? undefined
        : "No screen sound"
      : sharer.hasVoice
        ? undefined
        : `${name}'s mic is off`;
  const label = unavailable ? `${name}: ${unavailable}` : `${muted ? "Unmute" : "Mute"} ${what}`;
  return { what, unavailable, label };
}
