import type { RefObject } from "react";
import type { AmbilightPrefs } from "@services/preferences-service";

export interface StageStaticGlowProps {
  prefs: AmbilightPrefs;
  /** The TV turns on now: the first time the stage stands by in this visit. */
  turnOn: boolean;
}

/** The glow's box and its canvas, for the hook to draw in. */
export interface StaticGlowRefs {
  canvas: RefObject<HTMLCanvasElement | null>;
  stage: RefObject<HTMLSpanElement | null>;
}
