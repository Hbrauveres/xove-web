import type { frameTransforms } from "./frame-transforms.util";

/** Puts one frame's transforms on the wordmark's parts, found by their `data-` marks. */
export function applyFrame(svg: SVGSVGElement, t: ReturnType<typeof frameTransforms>) {
  svg.querySelector("[data-letters]")?.setAttribute("transform", t.letters);
  for (const [at, value] of Object.entries(t.corners))
    svg.querySelector(`[data-side="${at}"]`)?.setAttribute("transform", value);
  const wipe = svg.querySelector("[data-wipe]");
  wipe?.setAttribute("x", String(t.wipe.x));
  wipe?.setAttribute("width", String(t.wipe.width));
  const dot = svg.querySelector("[data-dot]");
  if (t.dot) dot?.setAttribute("transform", t.dot);
  else dot?.removeAttribute("transform");
}
