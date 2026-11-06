import type { AmbilightPrefs } from "@services/preferences-service";

export interface StageLightProps {
  /** The stage's video, or null when nothing is on the stage. */
  video: HTMLVideoElement | null;
  prefs: AmbilightPrefs;
  /** The stage's shape, width ÷ height: the glow follows it. */
  shape?: number | undefined;
}

/** The light's canvas: its size, where the stage sits inside it, and where it sits round the stage. */
export interface GlowLayout {
  width: number;
  height: number;
  /** The stage inside the canvas, in canvas pixels. */
  stage: { x: number; y: number; w: number; h: number };
  /** Where the canvas sits round the stage, so its middle covers the stage exactly. */
  placement: { left: string; width: string; top: string; height: string };
}

/** A rectangle: x, y, width, height. */
type Rect = [number, number, number, number];

/** One of the nine draws that put the picture on the canvas: which part, from where, to where. */
export interface EdgeDraw {
  at: string;
  src: Rect;
  dst: Rect;
}

/** Draws the light once, `now` ms into the page's life. */
export type LightPaint = (now: number) => void;

/** What the light draws from, and whether it's lit. */
export interface LightDrawing {
  video: HTMLVideoElement | null;
  layout: GlowLayout;
  mask: Uint8ClampedArray;
  lit: boolean;
}
