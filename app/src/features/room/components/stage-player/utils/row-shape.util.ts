import type { StreamControls } from "../../../types/stream-controls.types";
import type { Sharer } from "../../../types/room-view.types";
import type { RowShape } from "../types/row-fold.types";

/**
 * What the row on the picture holds, from who's on the stage: nothing live (the settings), my own
 * stream (my row), or someone else's (their sound and voice, and my mic while I'm live, or Go live).
 */
export function rowShape(big: Sharer | null, controls: StreamControls): RowShape {
  const watching = Boolean(big && !big.isMe);
  return {
    mine: Boolean(big?.isMe),
    settingsOnly: !big,
    sound: watching,
    voice: watching,
    live: controls.mine.screen || controls.mine.camera,
    held: watching && Boolean(controls.soundHeld),
  };
}
