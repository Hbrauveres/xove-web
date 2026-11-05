import { DECIMALS, HALF } from "../constants/mark.constants.ts";
import type { CornerAt, Frame, WordMark } from "../types/mark.types.ts";

const n = (v: number) => +v.toFixed(DECIMALS);
const translate = (x: number, y: number) => `translate(${n(x)},${n(y)})`;

/** Where each moving part of the wordmark is at one frame: transforms, and the letters' window. */
export function frameTransforms(mark: WordMark, f: Frame) {
  const { dx, dy, textShift } = mark.closed;
  const [lx, rx] = [dx.left * f.slide, dx.right * f.slide];
  const [ty, by] = [dy.top * f.settle, dy.bottom * f.settle];
  const corners: Record<CornerAt, string> = {
    "top-left": translate(lx, ty),
    "bottom-left": translate(lx, by),
    "bottom-right": translate(rx, by),
    "top-right": translate(rx, ty),
  };
  // The letters show only between the corners' inner edges.
  const inset = (mark.corners[0]?.width ?? 0) * HALF;
  const left = mark.frame.left + lx + inset;
  const right = mark.frame.right + rx - inset;
  const { cx, cy } = mark.dot;
  const round = f.eye.sx === 1 && f.eye.sy === 1;
  return {
    letters: translate(textShift * f.slide, 0),
    corners,
    wipe: { x: left, width: Math.max(0, right - left) },
    dot: round ? null : `translate(${cx},${cy}) scale(${f.eye.sx},${f.eye.sy}) translate(${-cx},${-cy})`,
  };
}
