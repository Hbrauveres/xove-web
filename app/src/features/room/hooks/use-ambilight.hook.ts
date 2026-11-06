import { useCallback, useMemo, useState } from "react";
import { loadAmbilight, saveAmbilight } from "@services/preferences-service";
import type { AmbilightPrefs } from "@services/preferences-service";

/** The ambilight's switch and brightness, as last chosen; every change is remembered for next time. */
export function useAmbilight(): [AmbilightPrefs, (next: AmbilightPrefs) => void] {
  const [ambilight, setAmbilight] = useState(loadAmbilight);
  const change = useCallback((next: AmbilightPrefs) => {
    saveAmbilight(next);
    setAmbilight(next);
  }, []);
  return useMemo(() => [ambilight, change], [ambilight, change]);
}
