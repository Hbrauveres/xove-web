import type { Sharer } from "../types/room-view.types";

/** Whether someone's preview has a row of buttons: anyone else's does; mine only for its swap, when I share both. */
export const hasRow = (s: Sharer) => !s.isMe || Boolean(s.screen && s.camera);
