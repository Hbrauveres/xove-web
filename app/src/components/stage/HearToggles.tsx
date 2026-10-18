import type { Sharer } from "../../types";
import { showToast } from "../ui/toast";
import { SoundIcon, VoiceIcon, VoiceOffIcon, VolumeOffIcon } from "./icons";
import type { Sound } from "./ViewerBar";
import styles from "./HearToggles.module.css";

/** What I hear from one person (spec 0123): their screen's sound and their voice, each its own mute. */
export type Hearing = { sound: Sound; voice: Sound };

/**
 * A preview's two toggles (spec 0123, round 2): mute or unmute that person's sound and voice for
 * me without opening their stream; the same mute their stage uses. A missing sound is greyed in
 * its place; their voice lights green while they speak.
 */
export function HearToggles({ sharer, hearing, onChange }: { sharer: Sharer; hearing: Hearing; onChange: (h: Hearing) => void }) {
  const name = sharer.person.name;
  const noSound = !(sharer.screen && sharer.hasSound) ? "No screen sound" : undefined;
  const noVoice = sharer.hasVoice ? undefined : `${name}'s mic is off`;
  const toggle = (kind: "sound" | "voice", unavailable?: string) => (e: React.MouseEvent) => {
    // The preview's own click opens the stream: a toggle doesn't.
    e.stopPropagation();
    if (unavailable) return showToast(unavailable, kind === "sound" ? <VolumeOffIcon /> : <VoiceOffIcon />);
    onChange({ ...hearing, [kind]: { ...hearing[kind], muted: !hearing[kind].muted } });
  };
  const soundOff = Boolean(noSound) || hearing.sound.muted;
  const voiceOff = Boolean(noVoice) || hearing.voice.muted;
  return (
    <span className={styles.toggles}>
      <button
        type="button"
        className={styles.toggle}
        aria-disabled={noSound ? true : undefined}
        aria-pressed={noSound ? undefined : hearing.sound.muted}
        aria-label={noSound ? `${name}: ${noSound}` : `Mute ${name}'s screen sound`}
        title={noSound ?? `${name}'s screen sound`}
        onClick={toggle("sound", noSound)}
      >
        {soundOff ? <VolumeOffIcon /> : <SoundIcon />}
      </button>
      <button
        type="button"
        className={styles.toggle}
        data-talking={(!voiceOff && sharer.speaking) || undefined}
        aria-disabled={noVoice ? true : undefined}
        aria-pressed={noVoice ? undefined : hearing.voice.muted}
        aria-label={noVoice ? `${name}: ${noVoice}` : `Mute ${name}'s voice`}
        title={noVoice ?? `${name}'s voice`}
        onClick={toggle("voice", noVoice)}
      >
        {voiceOff ? <VoiceOffIcon /> : <VoiceIcon />}
      </button>
    </span>
  );
}
