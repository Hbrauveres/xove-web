import type { CssVars } from "@shared/types/css-vars.types";

/** The stage's box in the picture's shape: its CSS takes the shape from `--shape`. */
export function shapeStyle(shape: number): CssVars {
  return { "--shape": shape };
}
