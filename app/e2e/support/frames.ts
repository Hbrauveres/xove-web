// What a strip of frames says: whether something that must stay put blinked or moved. Plain
// functions over the frames recorded in the page (track.ts), so they're tested on their own.

/** One tracked element on one animation frame. */
export interface Seen {
  present: boolean;
  visible: boolean;
  /** Its opacity times its ancestors': what reaches the screen, 0 to 1. */
  opacity: number;
  box: { x: number; y: number; w: number; h: number } | null;
}

/** Every tracked element on one animation frame, by name, with the frame's time in ms. */
export interface Frame {
  t: number;
  seen: Record<string, Seen>;
}

/** How much an opacity may dip before it counts as a blink (a fade shows on purpose is longer). */
const DIP = 0.15;

const shown = (s: Seen | undefined) => (s && s.present && s.visible ? s.opacity : 0);

/**
 * The frames where an element that's shown at the start and at the end went dimmer than both by more
 * than a dip: a blink. Empty when it stayed, or when it wasn't shown at either end.
 */
export function blinks(frames: readonly Frame[], name: string): number[] {
  if (frames.length < 3) return [];
  const first = shown(frames[0]?.seen[name]);
  const last = shown(frames.at(-1)?.seen[name]);
  const floor = Math.min(first, last) - DIP;
  if (first === 0 || last === 0) return [];
  return frames.flatMap((f, i) => (shown(f.seen[name]) < floor ? [i] : []));
}

/** The furthest an element's top-left corner went from where it started, in CSS px. */
export function drift(frames: readonly Frame[], name: string): number {
  const start = frames[0]?.seen[name]?.box;
  if (!start) return 0;
  return Math.max(
    0,
    ...frames.map((f) => {
      const b = f.seen[name]?.box;
      return b ? Math.hypot(b.x - start.x, b.y - start.y) : 0;
    }),
  );
}
