import { useCallback, useMemo, useState } from "react";
import type { StreamKind } from "@services/xove-api-service/types/api.types";
import type { PersonId } from "../types/room.types";
import type { Sharer } from "../types/room-view.types";
import type { Pick } from "../types/stage.types";
import { holds, isPlaying, mainKindOf, stagePick, streamsOf } from "../utils/stage-pick.util";

/**
 * Who is on my stage, kept by the room so the stage, the previews and the activity list can all
 * change it. By default, and when the picked person stops, it's the person sharing the longest; a
 * pick holds while that person shares. A person's screen and camera can be swapped, for the visit.
 */
export function useStage(sharers: Sharer[]) {
  const [picked, setPicked] = useState<Pick | null>(null);
  const [swappedFor, setSwappedFor] = useState<Record<PersonId, boolean>>({});
  // A pick holds while one of the streams live when it was made still is: once that person stops,
  // a later share of theirs doesn't bring the pick back.
  const holding = picked && holds(picked, sharers) ? picked.personId : null;

  const bigId = stagePick(
    sharers.map((s) => s.person.id),
    holding,
  );
  const big = sharers.find((s) => s.person.id === bigId) ?? null;
  const mainKind = mainKindOf(big, big ? Boolean(swappedFor[big.person.id]) : false);
  const playing = isPlaying(big, mainKind);

  const pick = useCallback(
    (personId: PersonId, kind?: StreamKind) => {
      setPicked({ personId, streams: streamsOf(sharers.find((s) => s.person.id === personId)) });
      if (kind) setSwappedFor((prev) => ({ ...prev, [personId]: kind === "camera" }));
    },
    [sharers],
  );
  const toggleSwap = useCallback(
    (personId: PersonId) => setSwappedFor((prev) => ({ ...prev, [personId]: !prev[personId] })),
    [],
  );

  return useMemo(
    () => ({ big, mainKind, playing, swappedFor, pick, toggleSwap }),
    [big, mainKind, playing, swappedFor, pick, toggleSwap],
  );
}
