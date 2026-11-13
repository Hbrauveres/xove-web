import { useEffect, useState } from "react";
import type { SettingsCue, SettingsGoTo, SettingsTab } from "../../../../types/settings.types";

/**
 * Going to a setting: a live button's gesture with the panel open chooses that setting's tab (never
 * one that can't be used) and cues its control, lit until the next press anywhere but a live
 * button, or until the panel closes. Requests made while it's closed are let go. What was asked
 * last is remembered across renders, the way React adjusts state when a prop changes.
 */
export function useSettingsCue(
  goTo: SettingsGoTo | undefined,
  open: boolean,
  usable: SettingsTab[],
  choose: (tab: SettingsTab) => void,
): SettingsCue | null {
  const [cue, setCue] = useState<SettingsCue | null>(null);
  const [lastGoTo, setLastGoTo] = useState(goTo?.n);
  if (goTo && goTo.n !== lastGoTo) {
    setLastGoTo(goTo.n);
    if (open && usable.includes(goTo.kind)) {
      choose(goTo.kind);
      setCue({ kind: goTo.kind, n: goTo.n });
    }
  }
  if (!open && cue) setCue(null);
  useEffect(() => {
    if (!cue) return;
    const off = (e: PointerEvent) => {
      if (!(e.target instanceof Element && e.target.closest("[data-dropup]"))) setCue(null);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [cue]);
  return cue;
}
