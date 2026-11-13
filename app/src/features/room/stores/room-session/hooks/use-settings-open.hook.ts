import { useCallback, useMemo, useState } from "react";
import type { StreamKind } from "@services/xove-api-service";
import type { SettingsGoTo } from "../../../types/settings.types";
import type { SettingsOpen } from "../types/room-session.types";

/** The settings panel over the cog: open or not, and the setting a live button's gesture asks for. */
export function useSettingsOpen(): SettingsOpen {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((was) => !was), []);
  const close = useCallback(() => setOpen(false), []);
  const [goTo, setGoTo] = useState<SettingsGoTo>();
  // The counter makes the same request twice still count.
  const goToSetting = useCallback((kind: StreamKind) => setGoTo((was) => ({ kind, n: (was?.n ?? 0) + 1 })), []);
  return useMemo(() => ({ open, toggle, close, goTo, goToSetting }), [open, toggle, close, goTo, goToSetting]);
}
