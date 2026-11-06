import { STRIP } from "../constants/stage-light.constants";
import type { EdgeDraw, GlowLayout } from "../types/stage-light.types";

/**
 * The nine draws that put a `w`×`h` picture on the canvas: the whole picture under the stage
 * (so no dark rim shows at its rounded edge), each edge strip stretched outward, and each
 * corner patch stretched into its corner. Together they cover every canvas pixel once.
 */
export function edgeDraws(l: GlowLayout, w: number, h: number): EdgeDraw[] {
  const { x, y, w: sw, h: sh } = l.stage;
  const x1 = x + sw;
  const y1 = y + sh;
  const right = l.width - x1;
  const bottom = l.height - y1;
  // Never more than the picture itself, however small it is.
  const e = Math.min(STRIP, w, h);
  return [
    { at: "stage", src: [0, 0, w, h], dst: [x, y, sw, sh] },
    { at: "top", src: [0, 0, w, e], dst: [x, 0, sw, y] },
    { at: "bottom", src: [0, h - e, w, e], dst: [x, y1, sw, bottom] },
    { at: "left", src: [0, 0, e, h], dst: [0, y, x, sh] },
    { at: "right", src: [w - e, 0, e, h], dst: [x1, y, right, sh] },
    { at: "top-left", src: [0, 0, e, e], dst: [0, 0, x, y] },
    { at: "top-right", src: [w - e, 0, e, e], dst: [x1, 0, right, y] },
    { at: "bottom-left", src: [0, h - e, e, e], dst: [0, y1, x, bottom] },
    { at: "bottom-right", src: [w - e, h - e, e, e], dst: [x1, y1, right, bottom] },
  ];
}
