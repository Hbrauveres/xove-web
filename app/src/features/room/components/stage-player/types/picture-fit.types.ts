import type { RowFit } from "../../../types/row-fit.types";

/** What fits on the picture, and the ref of the layer it's measured on. */
export interface PictureFit {
  setLayer: (layer: HTMLElement | null) => void;
  fit: RowFit;
  /** The small view fits; otherwise it folds by itself. */
  smallView: boolean;
}
