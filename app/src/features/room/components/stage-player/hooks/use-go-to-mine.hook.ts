import { useCallback, useEffect, useRef, useState } from "react";
import type { StreamKind } from "@services/xove-api-service";
import type { Sharer } from "../../../types/room-view.types";

/** Starting a stream takes me to it: it's picked for my stage once it's there. */
export function useGoToMine(
  start: (kind: StreamKind) => void,
  pick: (personId: string) => void,
  sharers: Sharer[],
): (kind: StreamKind) => void {
  const myId = sharers.find((s) => s.isMe)?.person.id;
  // How many times I started something, and how many of those took me to my stream.
  const [started, setStarted] = useState(0);
  const handled = useRef(0);
  useEffect(() => {
    if (!myId || handled.current === started) return;
    handled.current = started;
    pick(myId);
  }, [started, myId, pick]);
  return useCallback(
    (kind: StreamKind) => {
      start(kind);
      setStarted((n) => n + 1);
    },
    [start],
  );
}
