import { useLayoutEffect, useMemo, useState } from "react";
import type { RowFit, RowShape } from "../types/row-fold.types";
import { rowFold } from "../utils/row-fold.util";
import { rowItems } from "../utils/row-items.util";
import { GO_LIVE_PILL } from "../constants/row-fold.constants";

/**
 * How the controls fit the picture: which buttons fold into "…" and my own buttons' size and place,
 * from the picture's width. Go live is measured whenever it's shown and remembered while it's folded,
 * so a wider picture brings it back at the right moment. With the width unknown, nothing folds.
 */
export function useRowFold(picture: HTMLElement | null, width: number | null, shape: RowShape): RowFit {
  const [goLive, setGoLive] = useState<number | null>(null);
  useLayoutEffect(() => {
    const shown = Math.ceil(picture?.querySelector(GO_LIVE_PILL)?.getBoundingClientRect().width ?? 0);
    if (shown > 0) setGoLive(shown);
  });
  const { mine, settingsOnly, sound, voice, live } = shape;
  return useMemo(
    () => rowFold(width ?? Number.POSITIVE_INFINITY, rowItems({ mine, settingsOnly, sound, voice, live }, goLive)),
    [width, mine, settingsOnly, sound, voice, live, goLive],
  );
}
