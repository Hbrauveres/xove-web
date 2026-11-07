import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { floatingStore } from "@shared/stores/floating-store";
import { useHoldOrRest } from "../../../hooks/use-hold-or-rest.hook";
import type { HearSound, SoundKind } from "../../../types/sound.types";

/**
 * One sound's slider over the stream: it opens on a rest or the keyboard's focus (never over what the
 * person opened themselves), closes a moment after the mouse leaves or once untouched, and a change
 * (a mute, a new volume) keeps it open. Its timers close it only if it's still the open one: moving on
 * to the other sound must not close the slider just opened there.
 */
export function useViewerSound(
  kind: SoundKind,
  s: HearSound,
  open: boolean,
  setOpen: Dispatch<SetStateAction<SoundKind | null>>,
) {
  const timing = useHoldOrRest(() => setOpen((now) => (now === kind ? null : now)));
  const unavailable = Boolean(s.unavailable);
  const show = useCallback(() => {
    if (unavailable || !floatingStore.canRest()) return;
    setOpen(kind);
    timing.touch();
  }, [unavailable, setOpen, kind, timing]);
  return useMemo(
    () => ({
      show,
      rest: () => timing.rest(show),
      leave: () => timing.leave(true),
      toggle: () => {
        s.onChange({ ...s, muted: !s.muted });
        if (open) timing.touch();
      },
      setVolume: (volume: number) => {
        s.onChange({ volume, muted: false });
        timing.touch();
      },
    }),
    [show, timing, s, open],
  );
}
