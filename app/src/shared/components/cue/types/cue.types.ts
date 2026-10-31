import type { CSSProperties } from "react";

export interface CueProps {
  /** The request it's cued for: a new one starts its pulses over. Nothing without one. */
  request?: number | undefined;
  style?: CSSProperties | undefined;
}
