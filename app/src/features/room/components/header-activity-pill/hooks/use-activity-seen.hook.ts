import { useState } from "react";
import type { ActivityEvent } from "../../../types/room-view.types";
import type { ActivitySeen } from "../types/header-activity-pill.types";
import { unseenCount } from "../utils/unseen-count.util";

/** The list's open state and what's new: opening shows what's new, closing marks everything seen. */
export function useActivitySeen(events: ActivityEvent[]): ActivitySeen {
  const [open, setOpen] = useState(false);
  // The newest event seen in the list; everything after it is new.
  const [seenId, setSeenId] = useState<string | null>(null);
  const [newWhenOpened, setNewWhenOpened] = useState<ReadonlySet<string>>(new Set());
  const unseen = unseenCount(events, seenId);
  const markAllSeen = () => setSeenId(events.at(-1)?.id ?? null);

  const close = () => {
    markAllSeen();
    setOpen(false);
  };
  const toggle = () => {
    if (open) {
      close();
      return;
    }
    setNewWhenOpened(new Set(unseen > 0 ? events.slice(-unseen).map((e) => e.id) : []));
    markAllSeen();
    setOpen(true);
  };

  return { open, fresh: open ? 0 : unseen, newWhenOpened, toggle, close };
}
