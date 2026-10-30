import type { SVGProps } from "react";
import type { ICONS } from "../constants/icons.constants";

/** One shape of a drawing: its element and its attributes. */
type IconPart = readonly ["path" | "rect" | "circle", SVGProps<SVGElement>];

/** A drawing: its grid, the attributes set on the whole drawing, and its shapes. */
export interface IconDrawing {
  viewBox?: string;
  svg?: SVGProps<SVGSVGElement>;
  parts: readonly IconPart[];
}

/** Every icon the app draws, by name. */
export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  /** Its width and height in px; without one, its CSS sizes it. */
  size?: number;
  className?: string | undefined;
}
