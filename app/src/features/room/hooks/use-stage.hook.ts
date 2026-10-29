import { useCallback, useMemo, useState } from "react";
import type { StreamKind } from "@core/api/api.types";
import type { PersonId } from "../state/room.types";
import type { Sharer } from "../types/room-view.types";
import { isPlaying, mainKindOf, stagePick } from "../utils/stage-pick.util";

/**
 * Who is on my stage, kept by the room so the stage, the previews and the activity list can all
 * change it. By default, and when the picked person stops, it's the person sharing the longest; a
 * pick holds while that person shares. A person's screen and camera can be swapped, for the visit.
 */
export function useStage(sharers: Sharer[]) {
  const [picked, setPicked] = useState<PersonId | null>(null);
  const [swappedFor, setSwappedFor] = useState<Record<PersonId, boolean>>({});
  // A pick is forgotten once that person stops: if they share again later, the longest sharing
  // person is big again (set while rendering, React's way to follow a prop).
  if (picked !== null && !sharers.some((s) => s.person.id === picked)) setPicked(null);

  const bigId = stagePick(
    sharers.map((s) => s.person.id),
    picked,
  );
  const big = sharers.find((s) => s.person.id === bigId) ?? null;
  const mainKind = mainKindOf(big, big ? Boolean(swappedFor[big.person.id]) : false);
  const playing = isPlaying(big, mainKind);

  const pick = useCallback((personId: PersonId, kind?: StreamKind) => {
    setPicked(personId);
    if (kind) setSwappedFor((prev) => ({ ...prev, [personId]: kind === "camera" }));
  }, []);
  const toggleSwap = useCallback(
    (personId: PersonId) => setSwappedFor((prev) => ({ ...prev, [personId]: !prev[personId] })),
    [],
  );

  return useMemo(
    () => ({ big, mainKind, playing, swappedFor, pick, toggleSwap }),
    [big, mainKind, playing, swappedFor, pick, toggleSwap],
  );
}

export type StagePick = ReturnType<typeof useStage>;
