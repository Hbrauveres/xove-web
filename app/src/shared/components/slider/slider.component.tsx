import type { CssVars } from "@shared/types/css-vars.types";
import styles from "./slider.component.module.css";
import type { SliderProps } from "./types/slider.types";
import { fillOf } from "./utils/fill.util";

/**
 * A slider, white like a video player's: a plain range input, so the keyboard, screen readers and
 * touch work as on any slider. WebKit has no part for the filled side of the track, so `--fill`
 * tells the stylesheet how far the white goes. As a threshold, its knob is a line, and `--level`
 * says how far a live level goes in the track.
 */
export function Slider({
  variant = "white",
  level,
  sent,
  className,
  style,
  min = 0,
  max = 100,
  value,
  ...rest
}: SliderProps) {
  const threshold = variant === "threshold";
  const vars: CssVars = threshold
    ? { ...style, "--level": fillOf(level ?? 0, 0, 1) }
    : { ...style, "--fill": fillOf(value, Number(min), Number(max)) };
  return (
    <input
      type="range"
      className={[styles.range, threshold && styles.threshold, className].filter(Boolean).join(" ")}
      style={vars}
      data-sent={(threshold && sent) || undefined}
      min={min}
      max={max}
      value={value}
      {...rest}
    />
  );
}
