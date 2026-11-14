import type { InputHTMLAttributes } from "react";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /**
   * white (the default): a white fill up to a round knob. threshold: an upright line for a knob,
   * the common mark for a threshold, with a level that can be drawn in the track.
   */
  variant?: "white" | "threshold" | undefined;
  /** threshold: a live level (0 to 1) drawn in the track. */
  level?: number | undefined;
  /** threshold: the level is over the line (sent): drawn green, faint otherwise. */
  sent?: boolean | undefined;
};
