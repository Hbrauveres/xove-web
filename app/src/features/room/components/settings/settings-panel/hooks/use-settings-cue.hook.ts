import { useEffect } from "react";
import type { SettingsCue, SettingsGoTo, SettingsTab } from "../../../../types/settings.types";

/**
 * The session's cue, shown while the panel is open and on a tab that can be used. The next press
 * asks the session to end it, naming the request it saw: a press on a live button asks again first
 * (its drop-up's redirect), so that cue is a new one and stays lit.
 */
export function useSettingsCue(
  cue: SettingsGoTo | null | undefined,
  open: boolean,
  usable: SettingsTab[],
  onEnd: ((n: number) => void) | undefined,
): SettingsCue | null {
  const shown = open && cue && usable.includes(cue.kind) ? cue : null;
  useEffect(() => {
    if (!shown) return;
    const off = () => onEnd?.(shown.n);
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [shown, onEnd]);
  return shown;
}
