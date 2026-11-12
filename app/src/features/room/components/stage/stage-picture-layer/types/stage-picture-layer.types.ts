import type { ReactNode } from "react";
import type { PictureFit } from "../../../../types/picture-fit.types";

export interface StagePictureLayerProps {
  /** What fits on the picture: the layer hands itself to it, and offers Go live's report inside. */
  picture: PictureFit;
  /** The fullscreen button, always there. */
  fullscreen: ReactNode;
  /** The bar of controls, and the small view's corner button when there's one. */
  children: ReactNode;
}
