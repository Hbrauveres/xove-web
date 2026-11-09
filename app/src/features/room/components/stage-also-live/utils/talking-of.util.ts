import type { Sharer } from "../../../types/room-view.types";
import type { Hearing } from "../../../types/sound.types";

/**
 * Their voice heard while they speak, the row closed: the picture's ring lights (while the row is
 * open, its voice button does instead). My own preview lights while my voice is sent (`meTalking`).
 */
export const talkingOf = (s: Sharer, hearing: Hearing, rowOpen: boolean, meTalking = false) =>
  !rowOpen && (s.isMe ? meTalking : Boolean(s.hasVoice && s.speaking && !hearing.voice.muted));
