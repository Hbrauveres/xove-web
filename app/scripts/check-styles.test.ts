import postcss from "postcss";
import { describe, expect, it } from "vitest";
import {
  contrast,
  contrastProblems,
  disabledColourProblems,
  smallFontProblems,
  smallTextProblems,
  faviconProblems,
  glassFilterProblems,
  mixedVendorRules,
  reducedMotionProblems,
  tokensOf,
} from "./check-styles.ts";

const tokens = (css: string) => tokensOf(postcss.parse(css));
/** A palette that passes, with one token changed. */
const palette = (change: Record<string, string> = {}) => {
  const base: Record<string, string> = {
    ground: "#0c0c0d",
    surface: "#161617",
    "surface-raised": "#1b1b1d",
    text: "#ebebec",
    "text-muted": "#9a9a9f",
    accent: "#ef4b4b",
    "accent-ink": "#3a0808",
    ...change,
  };
  return `:root { ${Object.entries(base)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(" ")} }`;
};

describe("the style check: contrast", () => {
  it("measures contrast as WCAG does: black on white is 21:1, a colour on itself 1:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrast("#777777", "#777777")).toBe(1);
  });

  it("passes a palette whose text reads on every surface", () => {
    expect(contrastProblems(tokens(palette()))).toEqual([]);
  });

  it("names a text colour too faint for a surface, and a missing token", () => {
    expect(contrastProblems(tokens(palette({ "text-muted": "#333336" })))).toEqual(
      expect.arrayContaining([expect.stringMatching(/^--text-muted on --ground: [\d.]+:1, needs 4.5:1$/)]),
    );
    expect(contrastProblems(tokens(":root { --text: #ffffff; }"))).toContain("--text on --ground: a token is missing");
  });

  it("names a colour it can't measure, instead of letting it pass", () => {
    for (const unread of ["#111", "rgb(20, 20, 20)", "var(--black)"]) {
      expect(contrastProblems(tokens(palette({ ground: unread })))).toContain(
        `--text on --ground: "${unread}" isn't a #rrggbb colour this check can measure`,
      );
    }
  });
});

describe("the style check: one browser per rule", () => {
  it("names a rule that mixes -webkit- and -moz- pseudo-elements", () => {
    const css = postcss.parse(
      ".r::-webkit-slider-thumb, .r::-moz-range-thumb { width: 12px; }\n.r::-webkit-slider-thumb { height: 12px; }",
    );
    expect(mixedVendorRules(css, "Range.module.css")).toEqual([expect.stringMatching(/^Range\.module\.css:1: /)]);
  });
});

describe("the style check: glass blurs only", () => {
  const glass = (rule: string, root = "") => glassFilterProblems(postcss.parse(rule), "Panel.module.css", tokens(root));

  it("passes a blur, through a token or written out", () => {
    expect(glass(".p { backdrop-filter: var(--f); }", ":root { --b: 22px; --f: blur(var(--b)); }")).toEqual([]);
    expect(glass(".p { backdrop-filter: blur(8px); }")).toEqual([]);
  });

  it("names a hand-written -webkit-backdrop-filter: the build then drops the unprefixed one", () => {
    expect(glass(".p { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }")).toEqual([
      expect.stringMatching(/^Panel\.module\.css:1: -webkit-backdrop-filter .*the build adds it/),
    ]);
  });

  it("names a glass whose filter does more than blur, even through a token", () => {
    const chain = ":root { --b: 22px; --f: blur(var(--b)) brightness(0.55) saturate(1.2); }";
    expect(glass(".p { backdrop-filter: var(--f); }", chain)).toEqual([
      expect.stringMatching(/^Panel\.module\.css:1: .*brightness/),
    ]);
  });
});

describe("the style check: reduced motion", () => {
  it("passes when one rule stops every animation and transition", () => {
    const css = postcss.parse(
      "@media (prefers-reduced-motion: reduce) { *, *::before { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }",
    );
    expect(reducedMotionProblems(css)).toEqual([]);
  });

  it("fails when the rule is gone, or stops only animations", () => {
    expect(reducedMotionProblems(postcss.parse("* { color: red; }"))).toHaveLength(1);
    const half = postcss.parse("@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms; } }");
    expect(reducedMotionProblems(half)).toHaveLength(1);
  });
});

describe("the favicon's colours", () => {
  const page = new Map([
    ["ground", "#0c0c0d"],
    ["text", "#ebebec"],
    ["accent", "#ef4b4b"],
  ]);

  it("pass while they match the tokens, and are named when one drifts", () => {
    expect(faviconProblems(page, { ground: "#0c0c0d", ink: "#ebebec", red: "#ef4b4b" })).toEqual([]);
    expect(faviconProblems(page, { ground: "#0c0c0d", ink: "#ebebec", red: "#ff0000" })).toEqual([
      "the favicon's red (#ff0000) isn't --accent (#ef4b4b)",
    ]);
  });
});

describe("readable text", () => {
  it("names a text size under 11 px, not one at 11 px or a size that isn't text", () => {
    const sizes = tokens(
      ":root { --text-10: 0.625rem; --text-11: 0.6875rem; --text-xs: 0.75rem; --tracking-6: 0.06em; }",
    );
    expect(smallTextProblems(sizes)).toEqual(["--text-10 is 0.625rem: text is never smaller than 11 px"]);
  });

  it("names a font size under 11 px in any rule, by its token or its own value", () => {
    const sizes = tokens(":root { --size-2-5: 0.625rem; --text-11: 0.6875rem; }");
    const css = (rule: string) => smallFontProblems(postcss.parse(rule), "a.css", sizes);
    expect(css(".a { font-size: var(--text-11); }")).toEqual([]);
    expect(css(".a { font-size: var(--size-2-5); }")).toEqual([
      "a.css: font-size var(--size-2-5) is 0.625rem: text is never smaller than 11 px",
    ]);
    expect(css(".a { font-size: 0.5rem; }")).toHaveLength(1);
  });

  it("allows the disabled colour only on a disabled control", () => {
    const css = (rule: string) => disabledColourProblems(postcss.parse(rule), "a.css");
    expect(css(".tab[aria-disabled='true'] { color: var(--text-disabled); }")).toEqual([]);
    expect(css(".time { color: var(--text-disabled); }")).toEqual([
      "a.css: .time uses --text-disabled, which is only for a disabled control",
    ]);
  });

  it("asks every text colour for 4.5 : 1 on the glass over a white stream", () => {
    expect(
      contrastProblems(tokens(palette({ "text-muted": "#77777b" }))).some((p) => p.includes("glass-over-white")),
    ).toBe(true);
  });
});
