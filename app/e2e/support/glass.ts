// The glass rule (#249, design sheet: "glass fades itself, never its parent"): a backdrop-filter blurs
// only what is drawn in its own group. A parent with opacity below 1, a filter, a clip-path, a mask or
// will-change paints its children into an empty layer first, and a glass inside it blurs nothing.
import type { Page } from "@playwright/test";

declare global {
  interface Window {
    glassFindings?: Set<string>;
    glassSampling?: boolean;
  }
}

/** In the page: every glass shown now under a parent breaking its blur, as "<glass> under <parent>: <why>". */
function findGlassUnderBreakingParents(): string[] {
  const name = (el: Element) =>
    el.getAttribute("aria-label") ??
    el.getAttribute("role") ??
    `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`;
  const why = (s: CSSStyleDeclaration) =>
    [
      Number(s.opacity) < 1 && "opacity below 1",
      s.filter !== "none" && `filter ${s.filter}`,
      s.clipPath !== "none" && "clip-path",
      s.maskImage !== "none" && "mask",
      /opacity|filter|clip-path|mask/.test(s.willChange) && `will-change ${s.willChange}`,
    ].filter(Boolean);
  const found: string[] = [];
  for (const glass of document.querySelectorAll("body *")) {
    if (getComputedStyle(glass).backdropFilter === "none") continue;
    if (!glass.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    // Up to the nearest glass around it: glass on glass blurs that glass's own panel, as meant; what
    // is above that one is checked for it.
    for (let up = glass.parentElement; up && up !== document.body; up = up.parentElement) {
      const style = getComputedStyle(up);
      if (style.backdropFilter !== "none") break;
      const reasons = why(style);
      if (reasons.length) found.push(`${name(glass)} under ${name(up)}: ${reasons.join(", ")}`);
    }
  }
  return found;
}

/** Every glass shown now under a parent breaking its blur; empty when every glass blurs what's behind it. */
export const glassUnderBreakingParents = (page: Page): Promise<string[]> =>
  page.evaluate(findGlassUnderBreakingParents);

/**
 * The same, on every frame while `act` runs (a fade, an unroll): a glass broken for a moment of its
 * motion is found too. Each finding once.
 */
export async function glassUnderBreakingParentsWhile(page: Page, act: () => Promise<void>): Promise<string[]> {
  await page.evaluate(`window.findGlass = ${findGlassUnderBreakingParents.toString()}`);
  await page.evaluate(() => {
    const find = (window as unknown as { findGlass: () => string[] }).findGlass;
    window.glassFindings = new Set();
    window.glassSampling = true;
    const frame = () => {
      for (const f of find()) window.glassFindings?.add(f);
      if (window.glassSampling) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await act();
  return page.evaluate(() => {
    window.glassSampling = false;
    return [...(window.glassFindings ?? [])];
  });
}
