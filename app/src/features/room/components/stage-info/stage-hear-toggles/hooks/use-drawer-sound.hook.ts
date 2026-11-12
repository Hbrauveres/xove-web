import { useCallback, useMemo, useState } from "react";
import type { SoundKind } from "../../../../types/sound.types";

/**
 * Which sound the row's slider sets: the open one, kept while it rolls up so it doesn't change on
 * the way. Switching, the one it replaces is leaving and the new one entering, each let go when its
 * own animation ends.
 */
export function useDrawerSound(open: SoundKind | null) {
  const [shown, setShown] = useState<SoundKind | null>(null);
  const [leaving, setLeaving] = useState<SoundKind | null>(null);
  const [entering, setEntering] = useState<SoundKind | null>(null);
  if (open && open !== shown) {
    if (shown) {
      setLeaving(shown);
      setEntering(open);
    }
    setShown(open);
  }
  const left = useCallback(() => setLeaving(null), []);
  const entered = useCallback(() => setEntering(null), []);
  return useMemo(
    () => ({
      shown,
      leaving: leaving !== shown ? leaving : null,
      entering: entering !== null && entering === shown,
      left,
      entered,
    }),
    [shown, leaving, entering, left, entered],
  );
}
