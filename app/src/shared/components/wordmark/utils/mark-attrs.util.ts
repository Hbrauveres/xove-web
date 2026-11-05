import { MITER, STROKE, WIPE } from "../constants/mark.constants.ts";
import type { Box, Corner, Frame4, Stroke } from "../types/mark.types.ts";
import { pointsAttr } from "./mark.util.ts";

/** One stroke of a letter, square-ended, in the text colour. */
export const strokeAttrs = (s: Stroke) => ({
  points: pointsAttr(s.points),
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE,
  strokeLinecap: s.cap,
  strokeLinejoin: s.join,
  strokeMiterlimit: MITER,
});

/** A corner of the viewfinder: in the text colour, or red at the top right. */
export const cornerAttrs = (c: Corner) => ({
  "data-corner": c.at,
  "data-red": c.red || undefined,
  points: pointsAttr(c.points),
  fill: "none",
  stroke: c.red ? "var(--accent)" : "currentColor",
  strokeWidth: c.width,
  strokeLinejoin: "miter" as const,
});

/** The O's ring, in the text colour. */
export const ringAttrs = (ring: { cx: number; cy: number; r: number; width: number }) => ({
  cx: ring.cx,
  cy: ring.cy,
  r: ring.r,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: ring.width,
});

/** The record dot, in the accent. */
export const dotAttrs = (dot: { cx: number; cy: number; r: number }) => ({
  "data-dot": true,
  cx: dot.cx,
  cy: dot.cy,
  r: dot.r,
  fill: "var(--accent)",
});

/** The window the letters show through: between the corners, tall enough for the slide. */
export const wipeAttrs = (frame: Frame4) => ({
  "data-wipe": true,
  x: frame.left,
  y: WIPE.top,
  width: frame.right - frame.left,
  height: WIPE.height,
});

/** The drawing's box, at a height in px; its width follows. */
export const boxAttrs = (box: Box, height: number) => ({
  viewBox: `${box.x} ${box.y} ${box.width} ${box.height}`,
  height,
  width: (height * box.width) / box.height,
});
