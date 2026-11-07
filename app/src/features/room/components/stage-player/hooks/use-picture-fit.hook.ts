import type { StreamControls } from "../../../types/stream-controls.types";
import type { Sharer } from "../../../types/room-view.types";
import type { PictureFit } from "../types/picture-fit.types";
import { rowShape } from "../utils/row-shape.util";
import { smallViewFits } from "../utils/small-view-fits.util";
import { usePictureWidth } from "./use-picture-width.hook";
import { useRowFold } from "./use-row-fold.hook";

/** What fits on the picture: the controls' fold, my row's size and place, and the small view. */
export function usePictureFit(big: Sharer | null, controls: StreamControls): PictureFit {
  const picture = usePictureWidth();
  const fit = useRowFold(picture.width, picture.goLive, rowShape(big, controls));
  return { setLayer: picture.setLayer, fit, smallView: smallViewFits(picture.width) };
}
