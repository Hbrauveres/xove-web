import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFloating } from "@shared/stores/floating-store";
import { useHoldOrRest } from "../../../../hooks/use-hold-or-rest.hook";
import type { Hearing, SoundKind } from "../../../../types/sound.types";
import { useDrawerSound } from "./use-drawer-sound.hook";

/**
 * A preview's row: which sound's slider is open, its timing, the drawer's sounds, and the changes.
 * The open slider floats inside the row (Escape closes it); `onActive` is told while one is open,
 * so what holds the row keeps it open.
 */
export function useHearRow(hearing: Hearing, onChange: (h: Hearing) => void, onActive?: (active: boolean) => void) {
  const [open, setOpen] = useState<SoundKind | null>(null);
  const timing = useHoldOrRest(() => setOpen(null));
  const drawer = useDrawerSound(open);
  const tell = useRef(onActive);
  const latest = useRef({ hearing, onChange });
  useEffect(() => {
    tell.current = onActive;
    latest.current = { hearing, onChange };
  });
  useEffect(() => tell.current?.(open !== null), [open]);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useFloating({ open: open !== null, kind: "rest", close: () => setOpen(null), area: () => root });
  const show = useCallback(
    (kind: SoundKind) => {
      setOpen(kind);
      timing.touch();
    },
    [timing],
  );
  const toggle = useCallback(
    (kind: SoundKind) => {
      const { hearing: now, onChange: change } = latest.current;
      change({ ...now, [kind]: { ...now[kind], muted: !now[kind].muted } });
      timing.touch();
    },
    [timing],
  );
  const setVolume = useCallback(
    (kind: SoundKind, volume: number) => {
      latest.current.onChange({ ...latest.current.hearing, [kind]: { volume, muted: false } });
      timing.touch();
    },
    [timing],
  );
  return useMemo(
    () => ({ open, timing, drawer, setRoot, show, toggle, setVolume }),
    [open, timing, drawer, show, toggle, setVolume],
  );
}
