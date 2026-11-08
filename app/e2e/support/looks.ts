// The looks a case checks, by the app's own names (its tokens, tokens.css), never retyped: a value is
// written here as the CSS the app uses (`var(--accent)`, `blur(var(--blur-2))`) and resolved by the
// page into what a computed style reads, so a case compares like with like (ADR-0102).
import type { Locator, Page } from "@playwright/test";

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
  ground: "var(--ground)",
  accentSoft: "var(--accent-soft)",
  panel: "var(--panel)",
  panelFilter: "var(--panel-filter)",
  /** The thin light line around a panel and between its sections. */
  panelLine: "var(--panel-line)",
  fontDisplay: "var(--font-display)",
  fontBody: "var(--font-body)",
  fontMono: "var(--font-mono)",
  /** The keyboard's focus ring (global.css): its width and its offset. */
  focusRing: "var(--border-0-5) solid var(--accent)",
  focusOffset: "var(--border-0-5)",
  /** The page's line height (global.css), on its text size. */
  lineHeight: "1.5",
  /** Nothing painted: a clear background. */
  clear: "transparent",
  /** A menu row pointed at or focused, and its ring inside the edge. */
  rowLit: "var(--white-06)",
  rowRing: "inset 0 0 0 var(--border-0-5) var(--accent)",
  /** A soft pill (the empty stage's Camera), at rest and pointed at. */
  soft: "var(--text-shade-08)",
  softLit: "var(--text-shade-14)",
  /** A neutral count chip. */
  chip: "var(--white-10)",
  /** A ghost button's border, and its fill pointed at. */
  line: "var(--line)",
  raised: "var(--surface-raised)",
  /** A switch's knob when off. */
  knobOff: "var(--grey-189)",
  /** An error notice's red tint and border. */
  alertTint: "var(--live-10)",
  alertLine: "var(--live-45)",
  /** The glass's blur and shadow (round buttons, drop-up rows, pickers over the video). */
  glassBlur: "blur(var(--blur-2))",
  glassShadow: "0 var(--space-1) var(--space-4) var(--black-35)",
  /** The white focus ring of a switch and a slider. */
  whiteRing: "var(--border-0-5) solid var(--text)",
  /** LIVE's pulse: one beat. */
  pulse: "var(--duration-1600)",
  /** Round: a circle, and a pill's ends. */
  round: "50%",
  pillEnds: "var(--radius-pill)",
  /** A picker's chevron while its list is open: turned over. */
  flipped: "rotate(180deg)",
  /** Words said to screen readers, unseen: clipped away. */
  unseen: "inset(50%)",
} as const;

/** The weights the app's words come in (its stylesheets name them as numbers). */
export const WEIGHT = { medium: "500", semibold: "600" } as const;

/** How faded an unavailable control is drawn, and a slider whose setting is off (its stylesheets). */
export const FADED = { unavailable: "0.45", off: "0.4" } as const;

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

/** A length with the app's tokens (`var(--toast-width)`), in CSS px. */
export const pxOf = async (page: Page, value: string): Promise<number> =>
  Number.parseFloat(await computed(page, "width", value));

/** The app's named sizes the cases check against, as CSS lengths. */
export const SIZE = {
  /** A round button in L, my own row's. */
  buttonL: "var(--control-3xl)",
  /** A round button in M, the viewer bar's. */
  buttonM: "var(--control-sm)",
  /** The focus ring's width, and how far outside its control it sits. */
  ring: "var(--border-0-5)",
  /** A round button's icon, in L and in M. */
  iconL: "var(--size-5)",
  iconM: "var(--size-4)",
  /** An action pill in M (Go live) and in L (the empty stage's Screen and Camera). */
  pillM: "var(--control-sm)",
  pillL: "var(--control-2xl)",
  /** A label pill (a preview's name), a stat pill (who's watching), a count chip. */
  labelPill: "var(--size-5-5)",
  statPill: "var(--size-6-5)",
  chip: "var(--size-5)",
  /** A drop-up's row over the video. */
  dropUpRow: "var(--control-md)",
  /** A control in a panel (the settings' pickers). */
  panelControl: "var(--size-7-5)",
  /** The header's activity pill: its height, and its list's widest (a card's width). */
  headerPill: "var(--control-lg)",
  card: "var(--card-width)",
  /** A dropdown: its width (people), how far under its button it opens, its outer corners. */
  dropdown: "var(--dropdown-width)",
  dropdownGap: "var(--space-2)",
  panelCorner: "var(--radius-4)",
  /** A switch's target, and how far its knob travels. */
  switchWidth: "var(--control-md)",
  switchHeight: "var(--size-5)",
  knobTravel: "var(--space-5)",
  /** The words of a menu row, a control's name, a section heading, a notice. */
  rowText: "var(--text-13-5)",
  labelText: "var(--text-11)",
  headingText: "var(--text-xs)",
  noticeText: "var(--text-sm)",
  hairline: "var(--hairline)",
  /** A primary button pressed: how far it goes down. */
  pressed: "var(--space-0-25)",
} as const;

/** Sizes the app sets as numbers on a component, not as tokens (px). */
export const APP_PX = {
  /** My menu's width (HeaderMyMenu's dropdown). */
  myMenu: 260,
  /** A face on the admin page's requests. */
  adminFace: 36,
} as const;

/** An element's computed `property`, to find a computed value inside it (a shadow, a gradient). */
export const cssOf = (target: Locator, property: string): Promise<string> =>
  target.first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

/** A duration with the app's tokens (`var(--duration-160)`), in ms. */
export const msOf = async (page: Page, value: string): Promise<number> =>
  Number.parseFloat(await computed(page, "transition-duration", value)) * 1000;
