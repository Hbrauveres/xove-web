import type { CssVars } from "@shared/types/css-vars.types";
import styles from "./slider.component.module.css";
import type { SliderProps } from "./types/slider.types";
import { fillOf } from "./utils/fill.util";

/**
 * A slider, white like a video player's: a plain range input, so the keyboard, screen readers and
 * touch work as on any slider. WebKit has no part for the filled side of the track, so `--fill`
 * tells the stylesheet how far the white goes.
 */
export function Slider({ className, style, min = 0, max = 100, value, ...rest }: SliderProps) {
  const vars: CssVars = { ...style, "--fill": fillOf(value, Number(min), Number(max)) };
  return (
    <input
      type="range"
      className={[styles.range, className].filter(Boolean).join(" ")}
      style={vars}
      min={min}
      max={max}
      value={value}
      {...rest}
    />
  );
}
