import type { RowFit } from "./row-fit.types";

/** What fits on the picture, measured on its layer: the ref that measures, the fold, the small view. */
export interface PictureFit {
  setLayer: (layer: HTMLElement | null) => void;
  /** Where Go live reports its width. */
  setGoLive: (width: number) => void;
  fit: RowFit;
  /** The small view fits; otherwise it folds by itself. */
  smallView: boolean;
}
