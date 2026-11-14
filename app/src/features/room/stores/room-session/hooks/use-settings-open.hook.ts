import { useCallback, useMemo, useRef, useState } from "react";
import type { StreamKind } from "@services/xove-api-service";
import type { SettingsGoTo } from "../../../types/settings.types";
import type { SettingsOpen } from "../types/room-session.types";

/**
 * The settings panel over the cog: open or not, the setting a live button's gesture asks for, and
 * its cue, lit until a press ends it or the panel closes.
 */
export function useSettingsOpen(): SettingsOpen {
  const [open, setOpen] = useState(false);
  const [goTo, setGoTo] = useState<SettingsGoTo>();
  const [cue, setCue] = useState<SettingsGoTo | null>(null);
  // The counter makes the same request twice still count, and a press end only the cue it saw.
  const asked = useRef(0);
  const toggle = useCallback(() => {
    setOpen((was) => !was);
    setCue(null);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    setCue(null);
  }, []);
  const goToSetting = useCallback((kind: StreamKind) => {
    asked.current += 1;
    const request = { kind, n: asked.current };
    setGoTo(request);
    setCue(request);
  }, []);
  const endCue = useCallback((n: number) => setCue((was) => (was?.n === n ? null : was)), []);
  return useMemo(
    () => ({ open, toggle, close, goTo, goToSetting, cue, endCue }),
    [open, toggle, close, goTo, goToSetting, cue, endCue],
  );
}
