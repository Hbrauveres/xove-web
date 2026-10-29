import type { StreamKind } from "@core/api/types/api.types";
import type { MyStreamStep } from "./room.types";

/**
 * How often the room asks the API: the waiting screen for its place (which also tells the API
 * the page is there), every open room for the live streams, and entering again after a restart.
 */
export const POLL_MS = 2000;

/** How many events the activity keeps. */
export const ACTIVITY_KEPT = 30;

/** Stream places when the API hasn't said yet. */
export const STREAM_PLACES = 6;

export const KINDS: readonly StreamKind[] = ["screen", "camera"];

/** The steps that mean a start is under way: the picker open, or the API not answered yet. */
export const BUSY_STEPS: readonly MyStreamStep[] = ["picking", "starting"];

/** The steps each of my streams may move to from each step. */
export const NEXT_STEPS: Record<MyStreamStep, readonly MyStreamStep[]> = {
  off: ["picking"],
  picking: ["starting", "off"],
  starting: ["live", "off"],
  live: ["stopping", "off"],
  stopping: ["off"],
};
