import { useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { ARROWS } from "../constants/facecam.constants";
import type { FacecamDrag, FacecamMoveInput, FacecamRoom } from "../types/stage-facecam.types";
import { clampPlace } from "../utils/facecam-place.util";

/**
 * Moving the facecam: dragged with the pointer anywhere but its buttons, or with the arrow keys
 * while it has the focus; always kept whole inside the player it sits in, and moved from where it
 * shows (a place made on a bigger player is kept inside this one first).
 */
export function useFacecamMove({ box, buttons, player, place, onMove }: FacecamMoveInput) {
  const drag = useRef<FacecamDrag | null>(null);

  return useMemo(() => {
    const room = (): FacecamRoom | null => {
      const area = player.current?.getBoundingClientRect();
      const own = box.current?.getBoundingClientRect();
      if (!area || !own || area.width === 0 || area.height === 0) return null;
      return {
        width: area.width,
        height: area.height,
        maxX: 1 - own.width / area.width,
        maxY: 1 - own.height / area.height,
      };
    };

    // Where it shows: on a player smaller than it was placed on, its place kept inside this one.
    const shown = (r: FacecamRoom | null) => (r ? clampPlace(place, r.maxX, r.maxY) : place);

    const onPointerDown = (e: PointerEvent) => {
      // Its buttons are buttons, not handles.
      if (e.target instanceof Node && buttons.current?.contains(e.target)) return;
      drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, from: shown(room()) };
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
      const from = shown(r);
      onMove(clampPlace({ x: from.x + arrow.dx, y: from.y + arrow.dy }, r.maxX, r.maxY));
    };

    return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onKeyDown };
  }, [box, buttons, player, place, onMove]);
}
