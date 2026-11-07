import type { ReactNode } from "react";

export interface StagePictureLayerProps {
  /** Hands the layer to what measures it. */
  setLayer: (layer: HTMLElement | null) => void;
  /** My own row in M on a narrow picture: the fullscreen button stays level with it. */
  compact: boolean;
  /** The fullscreen button, always there. */
  fullscreen: ReactNode;
  /** The bar of controls, and the small view's corner button when there's one. */
  children: ReactNode;
}
