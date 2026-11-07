/** The picture layer's width, and the ref that watches it. */
export interface PictureWidth {
  ref: (el: HTMLElement | null) => void;
  /** In px; null until the layer is laid out. */
  width: number | null;
}
