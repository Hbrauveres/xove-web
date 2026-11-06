import type { LatestActivity } from "../../../types/activity.types";

export interface HeaderActivityTickerProps {
  /** The connection dropped: says so instead, with a spinner. */
  reconnecting: string | null;
  /** None before anything happened. */
  latest: LatestActivity | null;
}
