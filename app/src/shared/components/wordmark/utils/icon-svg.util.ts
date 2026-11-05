import { FAVICON } from "../constants/favicon.constants.ts";
import { DECIMALS } from "../constants/mark.constants.ts";
import { iconMark, pointsAttr } from "./mark.util.ts";

const n = (v: number) => +v.toFixed(DECIMALS);

/**
 * The favicon as a standalone SVG file; scripts/brand-icons.mjs writes it. The bare symbol at its
 * 16 px weight, edge to edge. Its white parts turn soft black when the browser is light (browsers
 * apply prefers-color-scheme inside SVG favicons); the red stays.
 */
export function iconSvg(): string {
  const { viewBox, corners, ring, dot } = iconMark("tiny");
  const box = [viewBox.x, viewBox.y, viewBox.width, viewBox.height].map(n).join(" ");
  const paint = (red: boolean) => (red ? `stroke="${FAVICON.red}"` : 'class="ink"');
  const lines = corners.map(
    (c) =>
      `<polyline points="${pointsAttr(c.points)}" fill="none" ${paint(c.red)} ` +
      `stroke-width="${c.width}" stroke-linejoin="miter"/>`,
  );
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">`,
    `<style>.ink { stroke: ${FAVICON.ink}; } ` +
      `@media (prefers-color-scheme: light) { .ink { stroke: ${FAVICON.ground}; } }</style>`,
    lines.join(""),
    `<circle cx="${ring.cx}" cy="${ring.cy}" r="${ring.r}" fill="none" class="ink" stroke-width="${ring.width}"/>`,
    `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${FAVICON.red}"/>`,
    `</svg>`,
    "",
  ].join("\n");
}
