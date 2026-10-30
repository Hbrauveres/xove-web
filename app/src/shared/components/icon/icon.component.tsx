import { createElement } from "react";
import { ICONS } from "@shared/constants/icons.constants";
import type { IconDrawing, IconProps } from "@shared/types/icon.types";

/** One of the app's icons, by name: decoration, so screen readers skip it and read its button instead. */
export function Icon({ name, size, className }: IconProps) {
  const { viewBox = "0 0 20 20", svg, parts }: IconDrawing = ICONS[name];
  return (
    <svg
      data-icon={name}
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...svg}
    >
      {parts.map(([tag, attributes], i) => createElement(tag, { key: i, ...attributes }))}
    </svg>
  );
}
