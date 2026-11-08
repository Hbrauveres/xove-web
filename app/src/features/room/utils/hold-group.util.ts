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
  const rest = { x: 0, y: 0, width: 0, height: 0 };
  // Where the pointer last moved to: an "over" there is the browser re-checking under a still
  // pointer (something slid under it), not the person moving to another part.
  const pointer = { x: Number.NaN, y: Number.NaN };
  const track = (e: PointerEvent) => Object.assign(pointer, { x: e.clientX, y: e.clientY });

  const apply = (animate: boolean) => {
    const glide = animate ? `transform ${RECENTRE_MS}ms ${RECENTRE_EASE}` : "";
    group.style.transition = [own, glide].filter(Boolean).join(", ") || "none";
    const moved = shift.y ? `translate(${shift.x}px, ${shift.y}px)` : `translateX(${shift.x}px)`;
    group.style.transform = shift.x || shift.y ? moved : "";
  };
  const over = (e: PointerEvent) => {
    const under = e.target instanceof Element ? e.target.closest(HELD_PART) : null;
    const still = e.clientX === pointer.x && e.clientY === pointer.y;
    if (!under || !group.contains(under) || (part && still)) return;
    // Back on the group: no "left" is pending any more.
    document.removeEventListener("pointermove", until);
    if (under === part) return;
    part = under;
    const r = under.getBoundingClientRect();
    Object.assign(rest, { x: r.left, y: r.top, width: r.width, height: r.height });
  };
  const onPart = (e: PointerEvent) =>
    e.clientX >= rest.x && e.clientX <= rest.x + rest.width && e.clientY >= rest.y && e.clientY <= rest.y + rest.height;
  const release = () => {
    document.removeEventListener("pointermove", until);
    part = null;
    if (!shift.x && !shift.y) return;
    shift.x = 0;
    shift.y = 0;
    apply(true);
  };
  // Off the part for real: a move past where it's held.
  const until = (e: PointerEvent) => !onPart(e) && release();
  // A "left" sent while the pointer is still on the held part (the browser re-checking under a still
  // pointer mid-glide) waits for the pointer to move off it.
  const leave = (e: PointerEvent) => (part && onPart(e) ? document.addEventListener("pointermove", until) : release());
  const pushed = () => {
    if (!part?.isConnected) return;
    const r = part.getBoundingClientRect();
    if (Math.abs(r.left - rest.x) < STILL_PX && Math.abs(r.top - rest.y) < STILL_PX) return;
    shift.x = heldShift(shift.x, rest.x, r.left);
    shift.y = heldShift(shift.y, rest.y, r.top);
    apply(false);
  };

  document.addEventListener("pointermove", track);
  group.addEventListener("pointerover", over);
  group.addEventListener("pointerleave", leave);
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(pushed);
  for (const el of [group, ...watched]) observer?.observe(el);
  return () => {
    group.removeEventListener("pointerover", over);
    group.removeEventListener("pointerleave", leave);
    document.removeEventListener("pointermove", until);
    document.removeEventListener("pointermove", track);
    observer?.disconnect();
  };
}
