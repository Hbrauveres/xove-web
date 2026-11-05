/**
 * Xovê's mark: [XOVE] in a viewfinder, the O a record button, the top-right corner red. Pure
 * geometry on one grid, so the components and the favicon draw the same shapes. Erasable syntax
 * only (types, `as const`): scripts/brand-icons.mjs runs it with Node's type stripping.
 */
import {
  ARM,
  CAP,
  DECIMALS,
  DOT_R,
  E_BAR_SHORT,
  GAP,
  HALF,
  ICON_SPACING,
  OPTICAL,
  PAD,
  STROKE,
  V_PAST,
  WIDTH,
} from "../constants/mark.constants.ts";
import type { Box, Corner, CornerAt, Frame4, Letter, Optical, Point, Stroke } from "../types/mark.types.ts";

const stroke = (...points: Point[]): Stroke => ({ points, cap: "butt", join: "miter" });

/** The four corners of a frame, each an L of `arm` along its two sides; only the top right is red. */
function corners({ left, right, top, bottom }: Frame4, arm: number, width = STROKE): Corner[] {
  const at: [CornerAt, number, number, number, number][] = [
    ["top-left", left, top, 1, 1],
    ["bottom-left", left, bottom, 1, -1],
    ["bottom-right", right, bottom, -1, -1],
    ["top-right", right, top, -1, 1],
  ];
  return at.map(([name, x, y, dx, dy]) => ({
    at: name,
    points: [
      [x + dx * arm, y],
      [x, y],
      [x, y + dy * arm],
    ],
    red: name === "top-right",
    width,
  }));
}

function letterX(x0: number): Letter {
  // Square ends whose outer corners touch the cap line and the X's sides.
  const phi = Math.atan2(CAP, WIDTH.X);
  const dx = STROKE * HALF * Math.sin(phi),
    dy = STROKE * HALF * Math.cos(phi);
  return {
    letter: "X",
    left: x0,
    strokes: [
      stroke([x0 + dx, dy], [x0 + WIDTH.X - dx, CAP - dy]),
      stroke([x0 + dx, CAP - dy], [x0 + WIDTH.X - dx, dy]),
    ],
  };
}

function letterV(x0: number): Letter {
  return {
    letter: "V",
    left: x0,
    strokes: [
      stroke(
        [x0 - V_PAST.out, V_PAST.top],
        [x0 + WIDTH.V * HALF, CAP + V_PAST.bottom],
        [x0 + WIDTH.V + V_PAST.out, V_PAST.top],
      ),
    ],
    clip: { x: x0, width: WIDTH.V },
  };
}

function letterE(x0: number): Letter {
  const i = STROKE * HALF;
  return {
    letter: "E",
    left: x0,
    strokes: [
      stroke([x0 + WIDTH.E, i], [x0 + i, i], [x0 + i, CAP - i], [x0 + WIDTH.E, CAP - i]),
      stroke([x0 + i, CAP * HALF], [x0 + WIDTH.E - E_BAR_SHORT, CAP * HALF]),
    ],
  };
}

/** The O's ring and its record dot, centred in an O as wide as the cap height. */
const recordO = (left: number, top: number, width = STROKE, r = DOT_R) => {
  const [cx, cy] = [left + WIDTH.O * HALF, top + WIDTH.O * HALF];
  return { ring: { cx, cy, r: WIDTH.O * HALF - width * HALF, width }, dot: { cx, cy, r } };
};

export function wordMark() {
  const frame = { left: STROKE * HALF, top: -PAD, bottom: CAP + PAD, right: 0 };
  let x = frame.left + PAD;
  const xLetter = letterX(x);
  x += WIDTH.X + GAP;
  const oLeft = x;
  const oLetter: Letter = { letter: "O", left: x, strokes: [] };
  x += WIDTH.O + GAP;
  const vLetter = letterV(x);
  x += WIDTH.V + GAP;
  const eLetter = letterE(x);
  frame.right = x + WIDTH.E + PAD;
  const viewBox: Box = {
    x: 0,
    y: frame.top - STROKE * HALF,
    width: frame.right + STROKE * HALF,
    height: frame.bottom - frame.top + STROKE,
  };
  return {
    viewBox,
    frame,
    corners: corners(frame, ARM),
    letters: [xLetter, oLetter, vLetter, eLetter],
    ...recordO(oLeft, CAP * HALF - WIDTH.O * HALF),
    /**
     * Where things move when the animation closes on the O: the left corners stay, the letters
     * slide left until the O sits where the icon has it, and the right corners close in to the O.
     * Then the corners settle to the icon's spacing up and down.
     */
    closed: {
      textShift: frame.left + ICON_SPACING.left - oLeft,
      dx: { left: 0, right: frame.left + ICON_SPACING.left + WIDTH.O + ICON_SPACING.right - frame.right },
      dy: { top: -ICON_SPACING.top - frame.top, bottom: CAP + ICON_SPACING.bottom - frame.bottom },
    },
  };
}

/** The symbol drawn for its size: heavier strokes grow inward, so the outer edges stay put. */
export function iconMark(optical: Optical = "large") {
  const o = OPTICAL[optical];
  const h = o.stroke * HALF;
  // The large icon's box, outer edges included: the O, its spacing around it.
  const oLeft = STROKE * HALF + ICON_SPACING.left,
    oTop = STROKE * HALF + ICON_SPACING.top;
  const outer = {
    left: 0,
    right: oLeft + WIDTH.O + ICON_SPACING.right + STROKE * HALF,
    top: 0,
    bottom: oTop + WIDTH.O + ICON_SPACING.bottom + STROKE * HALF,
  };
  const frame = { left: outer.left + h, right: outer.right - h, top: outer.top + h, bottom: outer.bottom - h };
  const size = (outer.bottom - outer.top) / o.fill;
  const viewBox: Box = {
    x: (outer.left + outer.right) * HALF - size * HALF,
    y: (outer.top + outer.bottom) * HALF - size * HALF,
    width: size,
    height: size,
  };
  return { viewBox, frame, corners: corners(frame, o.arm, o.stroke), ...recordO(oLeft, oTop, o.stroke, o.dot) };
}

/** Points as an SVG `points` attribute. */
export const pointsAttr = (points: readonly Point[]) =>
  points.map(([x, y]) => `${+x.toFixed(DECIMALS)},${+y.toFixed(DECIMALS)}`).join(" ");
