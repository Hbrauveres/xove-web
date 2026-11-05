const PERCENT = 100;

/** How far the white goes along the track, as a CSS percentage; empty for a value that isn't a number. */
export function fillOf(value: unknown, min: number, max: number) {
  const at = max > min ? (Number(value) - min) / (max - min) : 0;
  if (!Number.isFinite(at)) return "0%";
  return `${Math.round(Math.min(1, Math.max(0, at)) * PERCENT * PERCENT) / PERCENT}%`;
}
