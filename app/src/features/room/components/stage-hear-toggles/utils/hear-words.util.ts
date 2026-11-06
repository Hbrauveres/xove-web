import type { Sharer } from "../../../types/room-view.types";
import type { SoundKind } from "../../../types/sound.types";
import { NO_SCREEN_SOUND } from "../../../constants/stream-words.constants";

/** One of a person's sounds in words: what it is, why it can't be heard, and what a click does. */
export function hearWords(sharer: Sharer, kind: SoundKind, muted: boolean) {
  const name = sharer.person.name;
  const what = kind === "sound" ? `${name}'s screen sound` : `${name}'s voice`;
  const unavailable =
    kind === "sound"
      ? sharer.screen && sharer.hasSound
        ? undefined
        : NO_SCREEN_SOUND
      : sharer.hasVoice
        ? undefined
        : `${name}'s mic is off`;
  const label = unavailable ? `${name}: ${unavailable}` : `${muted ? "Unmute" : "Mute"} ${what}`;
  return { what, unavailable, label };
}
