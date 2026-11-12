import { useMemo } from "react";
import type { RowFit } from "../../../../types/row-fit.types";
import type { RowShape } from "../types/row-fold.types";
import { rowFold } from "../utils/row-fold.util";
import { rowItems } from "../utils/row-items.util";

/**
 * How the controls fit the picture: which buttons fold into "…" and my own buttons' size and place,
 * from the picture's width and Go live's. With the width unknown, nothing folds.
 */
export function useRowFold(width: number | null, goLive: number | null, shape: RowShape): RowFit {
  const { mine, settingsOnly, sound, voice, live, held } = shape;
  return useMemo(
    () =>
      rowFold(width ?? Number.POSITIVE_INFINITY, rowItems({ mine, settingsOnly, sound, voice, live, held }, goLive)),
    [width, goLive, mine, settingsOnly, sound, voice, live, held],
  );
}
