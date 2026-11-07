import type { StreamKind } from "@services/xove-api-service";
import { NO_SCREEN } from "../../../constants/stream-words.constants";
import type { StreamControls } from "../../../types/stream-controls.types";
import { fullRoom } from "../../../utils/full-room.util";

type Given = Pick<StreamControls, "mine" | "places" | "free" | "canShareScreen">;

/** Why a stream can't start: a browser that can't share a screen, or a full room. Nothing while it can. */
export function streamWhy(kind: StreamKind, c: Given) {
  if (c.mine[kind]) return undefined;
  if (kind === "screen" && !c.canShareScreen) return NO_SCREEN;
  return c.free <= 0 ? fullRoom(c.places) : undefined;
}
