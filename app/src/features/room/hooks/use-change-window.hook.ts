import { useCallback, useMemo, useState } from "react";
import type { StreamSettings } from "@core/api/api.types";

type Inputs = {
  /** Picks another window or tab into my screen: viewers keep the same stream. */
  changeScreen: (settings: StreamSettings) => Promise<{ hasSound: boolean } | null>;
  screen: StreamSettings;
  /** The new pick's sound may come or go. */
  onSound: (hasSound: boolean) => void;
};

/** "Change window": the same stream, another pick; busy while the picker is open. */
export function useChangeWindow({ changeScreen, screen, onSound }: Inputs) {
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
