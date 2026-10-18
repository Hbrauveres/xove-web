import type { CSSProperties } from "react";
import type { AmbilightPrefs } from "../../media/preferences";
import styles from "./CornerGlow.module.css";

/** The light's strength at `s` of its radius: the ambilight's own falloff (spec 0118). */
const falloff = (s: number) =>
  s >= 1 ? 0 : Math.exp(-3.4 * s) * (1 - s * s * s);

/** A round light at one corner: many stops along the falloff, so it fades without steps. */
function light(at: string, rgb: string, strength: number) {
  const stops = Array.from({ length: 13 }, (_, i) => {
    const s = i / 12;
    return `rgba(${rgb}, ${(falloff(s) * strength).toFixed(3)}) ${(s * 100).toFixed(1)}%`;
  });
  return `radial-gradient(circle var(--r) at ${at}, ${stops.join(", ")})`;
}

// The top right red as in the logo; the others a slightly blue grey, whose three colours step
// at different shades, so the dark end of the fade shows no bands.
const LIGHTS = [
  light("var(--r) var(--r)", "138, 150, 172", 0.32),
  light("calc(100% - var(--r)) var(--r)", "239, 75, 75", 0.6),
  light("var(--r) calc(100% - var(--r))", "138, 150, 172", 0.32),
  light("calc(100% - var(--r)) calc(100% - var(--r))", "138, 150, 172", 0.32),
].join(", ");

/**
 * Nobody live (spec 0123 prototype): the viewfinder's corners glow round the stage, each in its
 * own colour, as true circles centred on the corners. Drawn by the browser at the screen's own
 * resolution and still, so it costs nothing; it follows the ambilight's switch and brightness.
 */
export function CornerGlow({ prefs }: { prefs: AmbilightPrefs }) {
  return (
    <span
      className={styles.glow}
      style={
        {
          backgroundImage: LIGHTS,
          opacity: prefs.on ? prefs.brightness : 0,
        } as CSSProperties
      }
      aria-hidden="true"
    />
  );
}
