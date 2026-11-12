import type { HearSound } from "../../../../types/sound.types";
import type { Sharer } from "../../../../types/room-view.types";
import { NO_SCREEN_SOUND } from "../../../../constants/stream-words.constants";
import { NO_SOUND_HERE } from "../constants/stage-controls.constants";
import type { RoomHearing } from "../../../../types/room-hearing.types";

/**
 * What I hear from the person on the stage, for the viewer bar: their screen's sound and their
 * voice, each with my volume and mute and why it can't be heard, if it can't.
 */
export function hearProps(big: Sharer, hearOf: RoomHearing["hearOf"], setHear: RoomHearing["setHear"]) {
  const id = big.person.id;
  const hear = hearOf(id);
  const soundUnavailable = !big.screen ? NO_SCREEN_SOUND : big.hasSound ? undefined : NO_SOUND_HERE;
  const sound: HearSound = {
    ...hear.sound,
    onChange: (s) => setHear(id, { ...hearOf(id), sound: s }),
    ...(soundUnavailable ? { unavailable: soundUnavailable } : {}),
  };
  const voice: HearSound & { name: string; talking?: boolean } = {
    ...hear.voice,
    onChange: (v) => setHear(id, { ...hearOf(id), voice: v }),
    ...(big.hasVoice ? {} : { unavailable: `${big.person.name}'s mic is off` }),
    name: big.person.name,
    ...(big.speaking === undefined ? {} : { talking: big.speaking }),
  };
  return { sound, voice };
}
