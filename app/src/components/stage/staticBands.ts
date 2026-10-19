/**
 * The empty stage's static (spec 0136): how bright its bands are at a height and a moment, shared
 * by the static itself and the light it casts round the stage, so the two roll together.
 */

/** How fast the bands roll down, in CSS pixels a second. */
export const ROLL = 24;
/** How bright the gaps between the bands are, against the bands themselves. */
export const GAPS = 0.4;
/** How strongly the static shows over the stage's dark (its canvas's opacity). */
export const STRENGTH = 0.17;
/** Snow is half lit on average: a grain is anything from black to white. */
const MEAN = 0.5;
/** How bright the static looks on the stage at a band's brightness `light` (0–1 of white): what
 * its light round the stage may reach, never more. */
export const onScreen = (light: number) => light * MEAN * STRENGTH;

/**
 * The static's brightness (0–1) at `py` CSS pixels from the stage's top, `s` seconds into the
 * page's life. The bands roll down together, keeping their sizes; on top, the picture wavers up
 * and down a little, as a TV losing its vertical hold, and each band's brightness shimmers. The
 * gaps between them are dimmer snow, never black.
 */
export function bandLight(py: number, s: number) {
  const roll = py - s * ROLL + Math.sin(s * 0.9) * 14 + Math.sin(s * 2.7) * 4;
  const a = Math.sin(roll * 0.03) * 0.5 + 0.5;
  const b = Math.sin(roll * 0.009 + Math.sin(s * 0.3) * 0.35) * 0.5 + 0.5;
  const shimmer = 0.82 + 0.18 * Math.sin(s * 1.9 + roll * 0.004);
  const m = a * 0.55 + b * 0.45;
  const edge = Math.min(1, Math.max(0, (m - 0.42) / 0.16));
  return (GAPS + (1 - GAPS) * edge * edge * (3 - 2 * edge)) * shimmer;
}

/**
 * Whether the TV has turned on in this visit (the page's whole life): the stage's turn-on and its
 * light on the wall play only the first time the stage stands by, never again when the last stream
 * stops. Set once the stage has stood by.
 */
export const tv = { on: false };
