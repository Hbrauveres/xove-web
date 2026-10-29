import { useCallback, useMemo } from "react";
import type { StreamKind } from "@services/xove-api-service/types/api.types";
import { BUSY_STEPS } from "../constants/room.constants";
import { withMyStep } from "../state/room.model";
import type { RoomStore } from "../state/room.store";
import type { MyStreamStep } from "../types/room.types";

/** My streams' steps in the room's model: move one to its next step; is a start under way right now. */
export function useMySteps(store: RoomStore) {
  const step = useCallback(
    (kind: StreamKind, next: MyStreamStep) => store.change((m) => withMyStep(m, kind, next)),
    [store],
  );
  // Read at the moment it's needed: a start may have moved on since the last render.
  const busy = useCallback((kind: StreamKind) => BUSY_STEPS.includes(store.getState().model.mine[kind]), [store]);
  return useMemo(() => ({ step, busy }), [step, busy]);
}
