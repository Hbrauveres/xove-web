/** The golden angle: ids that differ only at the end ("user-3", "user-7") land far apart on the wheel. */
const GOLDEN_ANGLE = 137.508;
const HASH_MULTIPLIER = 31;
const HASH_MODULUS = 9973;
const HASH_SEED = 7;
const DEGREES = 360;

/** A person's colour, 0–360 on the colour wheel: the same person, the same colour, on every screen. */
export function hueOf(id: string): number {
  const hash = [...id].reduce((h, c) => (h * HASH_MULTIPLIER + c.charCodeAt(0)) % HASH_MODULUS, HASH_SEED);
  return Math.round((hash * GOLDEN_ANGLE) % DEGREES);
}
