// Checks the stylesheets for what a test can't see in jsdom and a person would: text readable on
// every surface, rules a browser would drop whole, and motion turned off for anyone who asks.
// Run from app/: npm run check:styles (Node 22.18+ strips the types). It runs in the commit checks.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type Root } from "postcss";

/** The surfaces text sits on, and each text colour with the contrast it needs there (WCAG AA). */
const SURFACES = ["ground", "surface", "surface-raised"];
const TEXTS: [string, number][] = [
  ["text", 4.5],
  ["text-muted", 4.5],
  ["accent", 4.5],
  ["text-faint", 3],
];

/** The custom properties declared on `:root`, as name → value. */
export function tokensOf(root: Root) {
  const tokens = new Map<string, string>();
  root.walkRules(":root", (rule) => rule.walkDecls(/^--/, (d) => void tokens.set(d.prop.slice(2), d.value.trim())));
  return tokens;
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** The contrast ratio between two `#rrggbb` colours, 1 to 21. */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every text colour on every surface, and the ink on red, that falls short of its ratio. */
export function contrastProblems(tokens: Map<string, string>) {
  const problems: string[] = [];
  const check = (fg: string, bg: string, min: number) => {
    const [a, b] = [tokens.get(fg), tokens.get(bg)];
    if (!a || !b) return problems.push(`--${fg} on --${bg}: a token is missing`);
    // Only a plain #rrggbb can be measured here; anything else (#fff, rgb(), var()) would measure as
    // nothing and pass unseen, so it's named instead.
    const unread = [a, b].find((c) => !/^#[0-9a-f]{6}$/i.test(c));
    if (unread) return problems.push(`--${fg} on --${bg}: "${unread}" isn't a #rrggbb colour this check can measure`);
    const ratio = contrast(a, b);
    if (ratio < min) problems.push(`--${fg} on --${bg}: ${ratio.toFixed(2)}:1, needs ${min}:1`);
  };
  for (const bg of SURFACES) for (const [fg, min] of TEXTS) check(fg, bg, min);
  check("accent-ink", "accent", 4.5);
  return problems;
}

/** Rules mixing two browsers' pseudo-elements: a browser drops a whole rule with a selector it doesn't know. */
export function mixedVendorRules(root: Root, file: string) {
  const problems: string[] = [];
  root.walkRules((rule) => {
    const vendors = new Set([...rule.selector.matchAll(/::-(webkit|moz)-/g)].map(([, v]) => v));
    if (vendors.size > 1)
      problems.push(
        `${file}:${rule.source?.start?.line}: "${rule.selector}" mixes -webkit- and -moz-; split it in two rules`,
      );
  });
  return problems;
}

/** The global rule that stops animations and transitions for anyone who asks for reduced motion. */
export function reducedMotionProblems(globalCss: Root) {
  let found = false;
  globalCss.walkAtRules("media", (media) => {
    if (!/prefers-reduced-motion:\s*reduce/.test(media.params)) return;
    media.walkRules((rule) => {
      const every = rule.selectors.includes("*");
      const props = new Set<string>();
      rule.walkDecls((d) => void props.add(d.prop));
      if (every && props.has("animation-duration") && props.has("transition-duration")) found = true;
    });
  });
  return found
    ? []
    : ["global.css: no rule under @media (prefers-reduced-motion: reduce) stops every animation and transition (*)"];
}

/** Every check over the app's stylesheets under `src`. */
export function checkStyles(src: string) {
  const files = readdirSync(src, { recursive: true, encoding: "utf8" }).filter((p) => p.endsWith(".css"));
  const parsed = files.map((file) => ({
    file,
    root: postcss.parse(readFileSync(join(src, file), "utf8"), { from: file }),
  }));
  const tokens = parsed.find((p) => p.file.endsWith("shared/styles/tokens.css"));
  const global = parsed.find((p) => p.file.endsWith("shared/styles/global.css"));
  if (!tokens) return ["src/shared/styles/tokens.css not found"];
  if (!global) return ["src/shared/styles/global.css not found"];
  return [
    ...contrastProblems(tokensOf(tokens.root)),
    ...parsed.flatMap(({ root, file }) => mixedVendorRules(root, file)),
    ...reducedMotionProblems(global.root),
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = checkStyles(join(import.meta.dirname, "../src"));
  for (const p of problems) console.error(p);
  console.log(
    problems.length
      ? `${problems.length} style problems.`
      : "Styles: contrast, browser rules and reduced motion all hold.",
  );
  process.exit(problems.length ? 1 : 0);
}
