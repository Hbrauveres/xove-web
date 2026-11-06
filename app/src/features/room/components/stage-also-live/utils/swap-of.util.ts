import type { Sharer } from "../../../types/room-view.types";

/** A preview's swap between screen and camera: only for someone sharing both, where the room offers it. */
export const swapOf = (s: Sharer, on: boolean, onSwap: (() => void) | undefined) =>
  s.screen && s.camera && onSwap ? { on, onSwap } : undefined;
