import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { FacecamPlace } from "../../../types/facecam.types";
import { ARROWS } from "../constants/facecam.constants";
import type { FacecamDrag, FacecamRoom } from "../types/stage-facecam.types";
import { clampPlace } from "../utils/facecam-place.util";

/**
 * Moving the facecam: dragged with the pointer anywhere but its buttons, or with the arrow keys
 * while it has the focus; always kept whole inside the player it sits in.
 */
export function useFacecamMove(
  box: RefObject<HTMLDivElement | null>,
  buttons: RefObject<HTMLDivElement | null>,
  place: FacecamPlace,
  onMove: (place: FacecamPlace) => void,
) {
  const drag = useRef<FacecamDrag | null>(null);

  const room = (): FacecamRoom | null => {
    const player = box.current?.parentElement?.getBoundingClientRect();
    const own = box.current?.getBoundingClientRect();
    if (!player || !own || player.width === 0 || player.height === 0) return null;
    return {
      width: player.width,
      height: player.height,
      maxX: 1 - own.width / player.width,
      maxY: 1 - own.height / player.height,
    };
  };

  const onPointerDown = (e: PointerEvent) => {
    // Its buttons are buttons, not handles.
    if (e.target instanceof Node && buttons.current?.contains(e.target)) return;
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, from: place };
    box.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    const start = drag.current;
    const r = room();
    if (!start || start.pointerId !== e.pointerId || !r) return;
    const to = {
      x: start.from.x + (e.clientX - start.x) / r.width,
      y: start.from.y + (e.clientY - start.y) / r.height,
    };
    onMove(clampPlace(to, r.maxX, r.maxY));
  };
  const endDrag = (e: PointerEvent) => {
    if (drag.current?.pointerId !== e.pointerId) return;
    drag.current = null;
    box.current?.releasePointerCapture?.(e.pointerId);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const arrow = ARROWS[e.key];
    const r = room();
    if (e.target !== box.current || !arrow || !r) return;
    e.preventDefault();
    onMove(clampPlace({ x: place.x + arrow.dx, y: place.y + arrow.dy }, r.maxX, r.maxY));
  };

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onKeyDown };
}
