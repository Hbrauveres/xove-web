/** The picture layer, its width, and the ref that watches it. */
export interface PictureWidth {
  ref: (el: HTMLElement | null) => void;
  /** The layer, once it's laid out. */
  el: HTMLElement | null;
  /** In px; null until the layer is laid out. */
  width: number | null;
}
