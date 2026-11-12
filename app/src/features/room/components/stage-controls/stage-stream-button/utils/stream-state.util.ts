import type { StreamKind } from "@services/xove-api-service";
import { NO_SOUND } from "../../../../constants/stream-words.constants";
import type { StreamControls } from "../../../../types/stream-controls.types";
import { LABEL } from "../constants/stage-stream-button.constants";
import { streamWhy } from "./stream-why.util";

type Given = Pick<StreamControls, "mine" | "places" | "free" | "canShareScreen" | "noSound" | "busy">;

/**
 * A stream button's state: live or not; unavailable (greyed, not hidden) where it can't start, saying
 * why; waiting while a request is on its way; and what it says, with my screen's missing sound.
 */
export function streamState(kind: StreamKind, c: Given) {
  const live = c.mine[kind];
  const why = streamWhy(kind, c);
  const label = live ? LABEL[kind].stop : LABEL[kind].start;
  const silent = kind === "screen" && live && c.noSound === true;
  return {
    live,
    unavailable: why !== undefined,
    blocked: why !== undefined || c.busy === true,
    label,
    tip: why ?? (silent ? `${label}. ${NO_SOUND}` : label),
  };
}
