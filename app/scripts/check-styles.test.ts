import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { checkStyles, contrast, contrastProblems, mixedVendorRules, reducedMotionProblems, tokensOf } from "./check-styles";

const tokens = (css: string) => tokensOf(postcss.parse(css));
/** A palette that passes, with one token changed. */
const palette = (change: Record<string, string> = {}) => {
  const base: Record<string, string> = {
    ground: "#0c0c0d",
    surface: "#161617",
    "surface-raised": "#1b1b1d",
    text: "#ebebec",
    "text-muted": "#9a9a9f",
    "text-faint": "#66666b",
    accent: "#ef4b4b",
    "accent-ink": "#3a0808",
    ...change,
  };
  return `:root { ${Object.entries(base).map(([k, v]) => `--${k}: ${v};`).join(" ")} }`;
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
});

describe("the style check: one browser per rule", () => {
  it("names a rule that mixes -webkit- and -moz- pseudo-elements", () => {
    const css = postcss.parse(".r::-webkit-slider-thumb, .r::-moz-range-thumb { width: 12px; }\n.r::-webkit-slider-thumb { height: 12px; }");
    expect(mixedVendorRules(css, "Range.module.css")).toEqual([expect.stringMatching(/^Range\.module\.css:1: /)]);
  });
});

describe("the style check: reduced motion", () => {
  it("passes when one rule stops every animation and transition", () => {
    const css = postcss.parse("@media (prefers-reduced-motion: reduce) { *, *::before { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }");
    expect(reducedMotionProblems(css)).toEqual([]);
  });

  it("fails when the rule is gone, or stops only animations", () => {
    expect(reducedMotionProblems(postcss.parse("* { color: red; }"))).toHaveLength(1);
    const half = postcss.parse("@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms; } }");
    expect(reducedMotionProblems(half)).toHaveLength(1);
  });
});

describe("the style check on the app's own stylesheets", () => {
  it("finds nothing", () => {
    expect(checkStyles(`${import.meta.dirname}/../src`)).toEqual([]);
  });
});
