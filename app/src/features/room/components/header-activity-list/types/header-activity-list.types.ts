import type { StreamKind } from "@services/xove-api-service";
import type { ActivityEvent, Friend } from "../../../types/room-view.types";
import type { OnStage } from "../../../types/watch-report.types";

export interface HeaderActivityListProps {
  /** Oldest first, as the room keeps them; shown newest first. */
  events: ActivityEvent[];
  people: Friend[];
  meId: string;
  /** The events not seen yet: highlighted. */
  unseen: ReadonlySet<string>;
  /** Whether that person's stream is still live. */
  isLive: (personId: string, kind: StreamKind) => boolean;
  /** What's on my stage. */
  watching: OnStage;
  onWatch: (personId: string, kind: StreamKind) => void;
}

/** What a row needs to know about the room. */
export interface ActivityRowContext {
  nameOf: (id: string) => string;
  meId: string;
  isLive: (personId: string, kind: StreamKind) => boolean;
  watching: OnStage;
}

/** What one event's row shows. */
export interface ActivityRow {
  text: string;
  /** The stream it's about ("screen" for the people events, which have none). */
  kind: StreamKind;
  /** About a stream starting or stopping: its icon is the accent's. */
  isStream: boolean;
  /** A live stream's start: a button that puts it on the stage. */
  watchable: boolean;
  /** That stream is on my stage now. */
  watched: boolean;
}
