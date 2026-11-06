import type { Friend } from "./room-view.types";

/** The latest event, as the activity pill shows it. */
export interface LatestActivity {
  id: string;
  text: string;
  /** How long ago, short: "now", "4 min". */
  ago: string;
  actor: Friend | undefined;
}
