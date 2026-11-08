/** How long a held group takes to glide back into place once the pointer leaves it. */
export const RECENTRE_MS = 220;
export const RECENTRE_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
/** A move smaller than this is the same place, in px. */
export const STILL_PX = 0.5;
/** A group's parts: what the pointer rests on, and must stay still under it. */
export const HELD_PART = "button, a, input";
