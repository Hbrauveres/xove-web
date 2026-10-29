import { useCallback, useEffect, useMemo, useState } from "react";
import { loadHearing, saveHearing } from "@services/preferences-service/preferences.service";
import type { HearingPrefs } from "@services/preferences-service/types/preferences.types";
import type { PersonId } from "../types/room.types";
import type { Choices, Heard } from "../types/hearing.types";
import type { Sharer } from "../types/room-view.types";
import { choose, downloads, hearingOf } from "../utils/hearing.util";

/**
 * What I hear from each person on my page: their screen's sound and their voice, each with its own
 * volume and one switch that follows them everywhere once touched, for the visit. A change to the
 * person on the stage also sets where the next person starts (remembered). The page downloads the
 * stage's sound and voice always, a preview's only while I hear it.
 */
export function useHearing(sharers: Sharer[], bigId: PersonId | null) {
  const [stageSound, setStageSound] = useState<HearingPrefs>(() => loadHearing("stream"));
  const [stageVoice, setStageVoice] = useState<HearingPrefs>(() => loadHearing("voice"));
  const [choices, setChoices] = useState<Record<PersonId, Choices>>({});

  const hearOf = useCallback(
    (id: PersonId): Heard =>
      hearingOf(choices[id], id === bigId, { sound: stageSound.volume, voice: stageVoice.volume }),
    [choices, bigId, stageSound.volume, stageVoice.volume],
  );

  const setHear = useCallback(
    (id: PersonId, next: Heard) => {
      const was = hearOf(id);
      setChoices((prev) => ({ ...prev, [id]: choose(prev[id], was, next) }));
      // Only a change to whoever is on the stage moves where the next person starts.
      if (id !== bigId) return;
      const sound = { volume: next.sound.volume, muted: false };
      const voice = { volume: next.voice.volume, muted: false };
      setStageSound(sound);
      saveHearing("stream", sound);
      setStageVoice(voice);
      saveHearing("voice", voice);
    },
    [hearOf, bigId],
  );

  // What's downloaded follows what's heard (the video server, outside React).
  useEffect(() => {
    for (const s of sharers) {
      if (s.isMe) continue;
      const onStage = s.person.id === bigId;
      s.setSoundOn?.(downloads(choices[s.person.id], onStage, "sound"));
      s.setVoiceOn?.(downloads(choices[s.person.id], onStage, "voice"));
    }
  }, [sharers, bigId, choices]);

  return useMemo(() => {
    const big = sharers.find((s) => s.person.id === bigId);
    const others = sharers.filter((s) => !s.isMe);
    // The voices that play: the big person's (muted in place while I mute it) and the previews' I hear;
    // and the previews' screen sounds I hear (the big one's plays with its picture).
    const voices = others
      .filter((s) => s.voice && s.hasVoice && (s === big || !hearOf(s.person.id).voice.muted))
      .flatMap((s) => (s.voice ? [{ id: s.person.id, track: s.voice, ...hearOf(s.person.id).voice }] : []));
    const previewSounds = others
      .filter((s) => s !== big && s.hasSound && !hearOf(s.person.id).sound.muted)
      .flatMap((s) => (s.sound ? [{ id: s.person.id, track: s.sound, ...hearOf(s.person.id).sound }] : []));
    const bigHearing = big && !big.isMe ? hearOf(big.person.id) : null;
    return { hearOf, setHear, bigHearing, voices, previewSounds, stageSound };
  }, [sharers, bigId, hearOf, setHear, stageSound]);
}
