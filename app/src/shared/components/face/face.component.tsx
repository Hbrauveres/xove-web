import { useState } from "react";
import { INITIAL_SHARE } from "./constants/face.constants";
import styles from "./face.component.module.css";
import type { FaceProps } from "./types/face.types";

/**
 * A person's face: their photo, or their initial; in the room, in their own colour, ringed while live.
 * The initial is drawn by the CSS: it's part of the picture, not text to read or to name a button by.
 */
export function Face({ name, hue, photo, size, onAir = false, ring = "outside" }: FaceProps) {
  const [broken, setBroken] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  if (photo && !broken)
    return (
      <img
        className={styles.photo}
        src={photo}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  if (hue === undefined)
    return (
      <span
        className={`${styles.photo} ${styles.initial}`}
        style={{ width: size, height: size, fontSize: size * INITIAL_SHARE.account }}
        data-initial={initial}
        aria-hidden="true"
      />
    );
  const lit = onAir ? (ring === "inside" ? styles.onAirInside : styles.onAir) : "";
  return (
    <span
      className={`${styles.room} ${lit}`}
      data-ring={onAir ? ring : undefined}
      style={{
        width: size,
        height: size,
        fontSize: size * INITIAL_SHARE.room,
        background: `hsl(${hue} 42% 38%)`,
        color: "var(--white)",
      }}
      data-initial={initial}
      aria-hidden="true"
    />
  );
}
