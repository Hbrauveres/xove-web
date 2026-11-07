// The state of named elements at one moment: what a person would notice (there, shown, where, how it
// looks) and what a screen reader would hear (role, name, pressed, expanded). Compared between the
// branch and the reference.
import type { Locator } from "@playwright/test";

/** The properties a case's look is compared on. */
const LOOK = ["opacity", "color", "backgroundColor", "backdropFilter", "borderColor", "boxShadow"] as const;

export interface ElementState {
  present: boolean;
  visible?: boolean;
  box?: { x: number; y: number; w: number; h: number };
  role?: string | null;
  name?: string | null;
  pressed?: string | null;
  expanded?: string | null;
  text?: string;
  look?: Record<string, string>;
}

/** Each named element's state now; one that isn't there says so. */
export async function stateOf(targets: Record<string, Locator>): Promise<Record<string, ElementState>> {
  const out: Record<string, ElementState> = {};
  for (const [name, locator] of Object.entries(targets)) {
    const first = locator.first();
    if ((await locator.count()) === 0) {
      out[name] = { present: false };
      continue;
    }
    out[name] = await first.evaluate(
      (el, look) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const round = (n: number) => Math.round(n * 10) / 10;
        return {
          present: true,
          visible: el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && r.width > 0,
          box: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) },
          role: el.getAttribute("role") ?? el.tagName.toLowerCase(),
          name: el.getAttribute("aria-label") ?? el.getAttribute("title"),
          pressed: el.getAttribute("aria-pressed"),
          expanded: el.getAttribute("aria-expanded"),
          text: (el.textContent ?? "").trim().slice(0, 120),
          look: Object.fromEntries(look.map((p) => [p, s[p as keyof CSSStyleDeclaration] as string])),
        };
      },
      LOOK as unknown as string[],
    );
  }
  return out;
}
