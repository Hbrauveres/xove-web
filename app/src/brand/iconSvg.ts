import { iconMark, pointsAttr } from "./mark.ts";

/** The favicon's colours, which can't read the page's tokens: white, the soft black ink on a light browser, and red. */
const GROUND = "#0c0c0d",
  WHITE = "#ebebec",
  RED = "#ef4b4b";

/**
 * The favicon as a standalone SVG file. scripts/brand-icons.mjs writes it.
 * The bare symbol at its 16 px weight, edge to edge. Its white parts turn soft black when the
 * browser is light (browsers apply prefers-color-scheme inside SVG favicons); the red stays.
 */
export function iconSvg(): string {
  const icon = iconMark("tiny");
  const { x, y, width, height } = icon.viewBox;
  const n = (v: number) => +v.toFixed(2);
  const corners = icon.corners
    .map(
      (c) =>
        `<polyline points="${pointsAttr(c.points)}" fill="none" ${c.red ? `stroke="${RED}"` : 'class="ink"'} stroke-width="${c.width}" stroke-linejoin="miter"/>`,
    )
    .join("");
  const { ring, dot } = icon;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(x)} ${n(y)} ${n(width)} ${n(height)}">`,
    `<style>.ink { stroke: ${WHITE}; } @media (prefers-color-scheme: light) { .ink { stroke: ${GROUND}; } }</style>`,
    corners,
    `<circle cx="${ring.cx}" cy="${ring.cy}" r="${ring.r}" fill="none" class="ink" stroke-width="${ring.width}"/>`,
    `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${RED}"/>`,
    `</svg>`,
    "",
  ].join("\n");
}
