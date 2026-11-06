import type { StreamKind } from "@services/xove-api-service";
import type { ConnectionState } from "@services/livekit-service";
import type { ActivityEvent, Friend } from "../../../types/room-view.types";
import type { OnStage } from "../../../types/watch-report.types";

export interface HeaderActivityPillProps {
  /** Oldest first. */
  events: ActivityEvent[];
  people: Friend[];
  meId: string;
  connection: ConnectionState;
  isLive: (personId: string, kind: StreamKind) => boolean;
  watching: OnStage;
  onWatch: (personId: string, kind: StreamKind) => void;
}

/** What's new in the activity, and the list's open state. */
export interface ActivitySeen {
  open: boolean;
  /** How many the pill counts as new: none while the list is open. */
  fresh: number;
  /** The ones that were new when the list opened: they stay highlighted while it's open. */
  newWhenOpened: ReadonlySet<string>;
  toggle: () => void;
  /** Closes the list; everything up to now counts as seen, what came in meanwhile too. */
  close: () => void;
}
