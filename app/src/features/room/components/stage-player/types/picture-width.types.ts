/** The picture layer's width, Go live's as last shown on it, and the ref that watches them. */
export interface PictureWidth {
  setLayer: (layer: HTMLElement | null) => void;
  /** In px; null until the layer is laid out. */
  width: number | null;
  /** Go live's pill, in px, as last shown on the layer; null before. */
  goLive: number | null;
}
