import type { LiveFeed } from "../../../types/room-view.types";

/** What plays big, and what plays in the facecam over it (only with a screen and a camera both live). */
export interface BigStreams {
  main: LiveFeed | null;
  small: LiveFeed | undefined;
}
