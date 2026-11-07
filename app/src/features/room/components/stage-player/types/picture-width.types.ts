/** The picture layer's width, Go live's, and the ref and the report that keep them. */
export interface PictureWidth {
  setLayer: (layer: HTMLElement | null) => void;
  /** In px; null until the layer is laid out. */
  width: number | null;
  /** Go live's pill, in px, as it last reported it; null before. */
  goLive: number | null;
  setGoLive: (width: number) => void;
}
