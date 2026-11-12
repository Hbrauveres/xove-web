import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { SettingsAnchor } from "../../../../types/settings-anchor.types";
import { HOLD_SETTINGS } from "../constants/stage-player.constants";
import type { StageSettings, StageSettingsInput } from "../types/stage-settings.types";
import { settingsPlace } from "../utils/settings-place.util";

/**
 * The settings over the stage: they open over the cog (or over Go live, where they came from its
 * menu), just above the round buttons, and follow them as the player or the row changes size. They
 * hold the controls up from the cog's click until they close however they close; another stream on
 * the stage closes them, since they belong to the buttons they opened from.
 */
export function useStageSettings({ frame, open, onToggle, bigId, hold }: StageSettingsInput): StageSettings {
  const cog = useRef<HTMLElement | null>(null);
  const row = useRef<HTMLElement | null>(null);
  const anchor = useMemo<SettingsAnchor>(
    () => ({
      cog: (el) => {
        cog.current = el;
      },
      row: (el) => {
        row.current = el;
      },
    }),
    [],
  );

  const toggle = useCallback(() => {
    hold(HOLD_SETTINGS, !open);
    onToggle();
  }, [hold, open, onToggle]);

  const shown = useRef(bigId);
  useEffect(() => {
    if (shown.current === bigId) return;
    shown.current = bigId;
    if (open) toggle();
  }, [bigId, open, toggle]);
  useEffect(() => {
    if (!open) hold(HOLD_SETTINGS, false);
  }, [open, hold]);

  useLayoutEffect(() => {
    const host = frame.current;
    if (!open || !host) return;
    const place = () => {
      const h = host.getBoundingClientRect();
      if (!cog.current || !row.current || !h.width) return;
      const vars = settingsPlace(h, cog.current.getBoundingClientRect(), row.current.getBoundingClientRect());
      for (const [name, value] of Object.entries(vars)) host.style.setProperty(name, value);
    };
    place();
    window.addEventListener("resize", place);
    // The row changes too (the volume comes and goes with who's on the stage).
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    watch?.observe(host);
    if (row.current) watch?.observe(row.current);
    return () => {
      window.removeEventListener("resize", place);
      watch?.disconnect();
    };
  }, [frame, open]);

  return useMemo(() => ({ anchor, toggle }), [anchor, toggle]);
}
