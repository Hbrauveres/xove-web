import { useMemo } from "react";
import type { PictureFit } from "../../../../types/picture-fit.types";
import type { StreamControls } from "../../../../types/stream-controls.types";
import type { Sharer } from "../../../../types/room-view.types";
import { rowShape } from "../utils/row-shape.util";
import { smallViewFits } from "../utils/small-view-fits.util";
import { usePictureWidth } from "./use-picture-width.hook";
import { useRowFold } from "./use-row-fold.hook";

/** What fits on the picture: the controls' fold, my row's size and place, and the small view. */
export function usePictureFit(big: Sharer | null, controls: StreamControls): PictureFit {
  const { setLayer, width, goLive, setGoLive } = usePictureWidth();
  const fit = useRowFold(width, goLive, rowShape(big, controls));
  return useMemo(
    () => ({ setLayer, setGoLive, fit, smallView: smallViewFits(width) }),
    [setLayer, setGoLive, fit, width],
  );
}
