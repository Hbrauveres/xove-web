// The looks a case checks, by the app's own names (its tokens, tokens.css), never retyped: a value is
// written here as the CSS the app uses (`var(--accent)`, `blur(var(--blur-2))`) and resolved by the
// page into what a computed style reads, so a case compares like with like (ADR-0102).
import type { Page } from "@playwright/test";

/** The app's named looks the cases check against, as CSS. */
export const LOOK = {
  accent: "var(--accent)",
  accentLight: "var(--accent-light)",
  accentInk: "var(--accent-ink)",
  text: "var(--text)",
  muted: "var(--text-muted)",
  glass: "var(--glass)",
  glassLit: "var(--grey-40-85)",
  live: "var(--live)",
  ok: "var(--ok)",
} as const;

/**
 * What `value` (CSS, with the app's tokens) computes to for `property` on this page: how a computed
 * style reads it ("rgb(239, 75, 75)", "blur(8px)", "44px").
 */
export async function computed(page: Page, property: string, value: string): Promise<string> {
  return page.evaluate(
    ([property, value]) => {
      const probe = document.createElement("div");
      probe.style.setProperty(property, value);
      document.body.append(probe);
      const out = getComputedStyle(probe).getPropertyValue(property);
      probe.remove();
      return out;
    },
    [property, value] as const,
  );
}
