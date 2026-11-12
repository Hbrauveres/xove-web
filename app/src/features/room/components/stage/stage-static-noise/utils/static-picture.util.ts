import { HALF } from "../../../../constants/math.constants";
import { MS_PER_SECOND } from "@shared/constants/time.constants";
import { bandLight } from "../../../../utils/static-bands.util";
import {
  BULGE,
  GREEN_SHIFT,
  OPAQUE_PIXEL,
  RED_SHIFT,
  TOP_BYTE,
  XORSHIFT_A,
  XORSHIFT_B,
  XORSHIFT_C,
  XORSHIFT_SEED,
} from "../constants/static-noise.constants";

/** A share of the width from the middle, from -1 at the left edge to 1 at the right. */
const fromCentre = (x: number, w: number) => (x / w - HALF) / HALF;

/**
 * The static's picture on a canvas: snow in the rolling bands, behind curved glass. `fit` sizes it
 * (in grains) and clears it; `draw` paints one moment, `t` ms into the page's life.
 */
export function staticPicture(ctx: CanvasRenderingContext2D) {
  let w = 0;
  let h = 0;
  let image: ImageData | null = null;
  let words = new Uint32Array(0);
  // For each column, how far it bows the rows (the glass's curve), as a share of the row's
  // distance from the middle.
  let bow = new Float32Array(0);
  // Each row's brightness (0–1), for this moment.
  let gain = new Float32Array(0);
  let seed = XORSHIFT_SEED;

  const fit = (width: number, height: number) => {
    w = width;
    h = height;
    image = ctx.createImageData(w, h);
    words = new Uint32Array(image.data.buffer);
    bow = Float32Array.from({ length: w }, (_, x) => BULGE * fromCentre(x, w) * fromCentre(x, w));
    gain = new Float32Array(h);
  };

  const draw = (t: number) => {
    if (!image) return;
    const s = t / MS_PER_SECOND;
    // As a share of the stage's height, so the bands keep their place whatever the grain or size.
    for (let y = 0; y < h; y++) gain[y] = bandLight(y / h, s);
    const mid = h * HALF;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        seed ^= seed << XORSHIFT_A;
        seed ^= seed >>> XORSHIFT_B;
        seed ^= seed << XORSHIFT_C;
        // Behind curved glass the rows bow towards the middle at the sides.
        const bowed = (y - (y - mid) * (bow[x] ?? 0)) | 0;
        const c = ((seed >>> TOP_BYTE) * (gain[bowed] ?? 0)) | 0;
        words[y * w + x] = OPAQUE_PIXEL | (c << RED_SHIFT) | (c << GREEN_SHIFT) | c;
      }
    }
    ctx.putImageData(image, 0, 0);
  };

  return { fit, draw };
}
