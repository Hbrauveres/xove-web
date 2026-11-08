import { HELD_PART, RECENTRE_EASE, RECENTRE_MS, STILL_PX } from "../constants/held-group.constants";
import { heldShift } from "./held-shift.util";

/**
 * Nothing moves under the pointer: while the pointer is on one of `group`'s parts, the group moves
 * back by however far that part was pushed, across and down, whatever pushed it. It's measured after
 * layout and before paint (a ResizeObserver on the group and on what's `watched`), on every frame of
 * an animation. Once the pointer leaves, the group glides back into place. Returns what stops it.
 */
export function holdGroup(group: HTMLElement, watched: Element[] = []): () => void {
  const shift = { x: 0, y: 0 };
  // The group's own transitions (a layer gliding with its picture) go on while it's held.
  const declared = getComputedStyle(group).transition;
  const own = !declared || declared === "none" || declared.startsWith("all 0s") ? "" : declared;
  // The part under the pointer, and where it sits while the pointer rests there.
  let part: Element | null = null;
  const rest = { x: 0, y: 0 };

  const apply = (animate: boolean) => {
    const glide = animate ? `transform ${RECENTRE_MS}ms ${RECENTRE_EASE}` : "";
    group.style.transition = [own, glide].filter(Boolean).join(", ") || "none";
    const moved = shift.y ? `translate(${shift.x}px, ${shift.y}px)` : `translateX(${shift.x}px)`;
    group.style.transform = shift.x || shift.y ? moved : "";
  };
  const over = (e: PointerEvent) => {
    const under = e.target instanceof Element ? e.target.closest(HELD_PART) : null;
    if (!under || under === part || !group.contains(under)) return;
    part = under;
    const r = under.getBoundingClientRect();
    rest.x = r.left;
    rest.y = r.top;
  };
  const leave = () => {
    part = null;
    if (!shift.x && !shift.y) return;
    shift.x = 0;
    shift.y = 0;
    apply(true);
  };
  const pushed = () => {
    if (!part?.isConnected) return;
    const r = part.getBoundingClientRect();
    if (Math.abs(r.left - rest.x) < STILL_PX && Math.abs(r.top - rest.y) < STILL_PX) return;
    shift.x = heldShift(shift.x, rest.x, r.left);
    shift.y = heldShift(shift.y, rest.y, r.top);
    apply(false);
  };

  group.addEventListener("pointerover", over);
  group.addEventListener("pointerleave", leave);
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(pushed);
  for (const el of [group, ...watched]) observer?.observe(el);
  return () => {
    group.removeEventListener("pointerover", over);
    group.removeEventListener("pointerleave", leave);
    observer?.disconnect();
  };
}
