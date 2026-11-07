import type { StreamKind } from "@services/xove-api-service";
import type { StreamIcon } from "../types/stage-stream-button.types";

/**
 * The design's icons: plain while live; crossed while off, the screen showing "share" (a screen with
 * an arrow up) while pointed at or focused, so it says what a click does.
 */
export function streamIcon(kind: StreamKind, live: boolean): StreamIcon {
  if (kind === "camera") return { rest: live ? "camera-on" : "camera-off" };
  return live ? { rest: "screen-on" } : { rest: "screen-off", hover: "screen-share" };
}
