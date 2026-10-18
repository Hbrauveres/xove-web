import { MicIcon } from "./icons";
import styles from "./VoicePill.module.css";

/**
 * A preview's voice (spec 0123, rounds 119 to 140): a small round pill with the mic, neon on dark
 * while its person speaks, faded while they're silent. Never on my own stream.
 */
export function VoicePill({ name, talking, size = 16 }: { name: string; talking?: boolean; size?: number }) {
  return (
    <span
      className={styles.pill}
      data-talking={talking || undefined}
      style={{ width: size, height: size }}
      title={`${name}'s voice`}
      aria-label={talking ? `${name} is speaking` : `${name}'s voice is on`}
      role="img"
    >
      <MicIcon />
    </span>
  );
}
