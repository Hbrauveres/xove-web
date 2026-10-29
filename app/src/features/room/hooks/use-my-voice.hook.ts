import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VoiceProblem } from "@core/devices/types/devices.types";
import { loadVoicePrefs, saveVoicePrefs } from "@core/preferences/preferences.service";
import type { VoicePrefs } from "@core/preferences/types/preferences.types";
import { showToast } from "../../../components/ui/toast";
import { VOICE_PROBLEMS } from "../constants/voice.constants";

type Inputs = {
  /** My voice is being sent. */
  voice: boolean;
  /** My screen or my camera is being sent: a voice never travels alone. */
  sending: boolean;
  startVoice: (prefs: VoicePrefs) => Promise<VoiceProblem>;
  stopVoice: () => Promise<void>;
  applyVoice: (prefs: VoicePrefs) => Promise<void>;
  setVoiceLine: (line: number) => void;
};

/**
 * My voice: only by my choice, only while I send a screen or a camera. One start at a time; the mic
 * and its processing apply live, the line moves live; it stops when I stop sending both streams.
 */
export function useMyVoice({ voice, sending, startVoice, stopVoice, applyVoice, setVoiceLine }: Inputs) {
  const [voicePrefs, setPrefs] = useState<VoicePrefs>(loadVoicePrefs);
  // A second click while the mic is being asked for does nothing.
  const starting = useRef(false);

  const toggleVoice = useCallback(async () => {
    if (voice) return stopVoice();
    if (starting.current) return;
    starting.current = true;
    try {
      const problem = await startVoice(voicePrefs);
      if (problem) showToast(VOICE_PROBLEMS[problem]);
    } finally {
      starting.current = false;
    }
  }, [voice, startVoice, stopVoice, voicePrefs]);

  const setVoicePrefs = useCallback(
    (next: VoicePrefs) => {
      setPrefs(next);
      saveVoicePrefs(next);
      // The sensitivity is the gate's line: it moves live. The rest restarts the mic.
      const { sensitivity: line, ...mic } = next;
      const { sensitivity: _was, ...was } = voicePrefs;
      setVoiceLine(line);
      if (voice && JSON.stringify(mic) !== JSON.stringify(was)) void applyVoice(next);
    },
    [voice, voicePrefs, setVoiceLine, applyVoice],
  );

  useEffect(() => {
    if (!sending && voice) void stopVoice();
  }, [sending, voice, stopVoice]);

  return useMemo(
    () => ({ voicePrefs, setVoicePrefs, toggleVoice: () => void toggleVoice() }),
    [voicePrefs, setVoicePrefs, toggleVoice],
  );
}
