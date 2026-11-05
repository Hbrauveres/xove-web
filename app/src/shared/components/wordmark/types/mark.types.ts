import type { OPTICAL } from "../constants/mark.constants";
import type { wordMark } from "../utils/mark.util";

export type Point = readonly [number, number];
/** A stroke: a line or a polyline, its ends square to itself. */
export type Stroke = { points: Point[]; cap: "butt"; join: "miter" };
/** A letter's strokes; `clip` cuts them flat at the cap height (the V's tips). */
export type Letter = {
  letter: "X" | "O" | "V" | "E";
  left: number;
  strokes: Stroke[];
  clip?: { x: number; width: number };
};
export type CornerAt = "top-left" | "bottom-left" | "bottom-right" | "top-right";
export type Corner = { at: CornerAt; points: Point[]; red: boolean; width: number };
export type Box = { x: number; y: number; width: number; height: number };
export type Frame4 = { left: number; right: number; top: number; bottom: number };
export type Optical = keyof typeof OPTICAL;
export type WordMark = ReturnType<typeof wordMark>;
/** One moment of the animation: `slide` and `settle` run 0–1; `eye` scales the dot (sy near 0 is shut). */
export type Frame = { slide: number; settle: number; eye: { sx: number; sy: number } };
export type WordmarkProps = {
  /** The whole word, or the symbol alone. */
  variant?: "full" | "icon";
  /** Its height, in px; the icon is square. */
  height: number;
};
