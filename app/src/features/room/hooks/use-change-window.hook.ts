import { useCallback, useMemo, useState } from "react";
import type { ChangeWindowInputs } from "../types/change-window.types";

/** "Change window": the same stream, another pick; busy while the picker is open. */
export function useChangeWindow({ changeScreen, screen, onSound }: ChangeWindowInputs) {
  const [changing, setChanging] = useState(false);
  const change = useCallback(async () => {
    setChanging(true);
    try {
      const changed = await changeScreen(screen);
      if (changed) onSound(changed.hasSound);
    } finally {
      setChanging(false);
    }
  }, [changeScreen, screen, onSound]);
  return useMemo(() => ({ changeScreen: () => void change(), changing }), [change, changing]);
}
