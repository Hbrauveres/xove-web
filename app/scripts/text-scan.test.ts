import { describe, expect, it } from "vitest";
import { blank, callSpans, commentSpans, stringSpans, withoutComments } from "./text-scan.ts";

describe("scanning a text for strings and comments", () => {
  it("finds each quoted string, an escaped quote staying inside", () => {
    const line = `say("it's \\"fine\\"", 'a', \`b\`)`;
    expect(stringSpans(line).map(([from, to]) => line.slice(from, to))).toEqual([`"it's \\"fine\\""`, "'a'", "`b`"]);
  });

  it("takes a quote not closed on its line for no string, and reads only the quotes it's given", () => {
    expect(stringSpans(`a "b`)).toEqual([]);
    expect(stringSpans(`// it's "x"`)).toEqual([[8, 11]]);
    expect(stringSpans(`'a\nb'`)).toEqual([]);
    expect(stringSpans("say `x` and 'y'", "\"'")).toEqual([[12, 15]]);
  });

  it("blanks a CSS comment, keeping its line breaks, and leaves an unclosed one", () => {
    expect(withoutComments("a /* b\nc */ d")).toBe("a     \n     d");
    expect(commentSpans("a /* b")).toEqual([]);
  });

  it("finds a call whole, its parentheses balanced", () => {
    const css = ":global(.dark:not(.lite)) .a { background: url(a.png); }";
    expect(callSpans(css, ":global").map(([from, to]) => css.slice(from, to))).toEqual([":global(.dark:not(.lite))"]);
    expect(callSpans(css, "url").map(([from, to]) => css.slice(from, to))).toEqual(["url(a.png)"]);
  });

  it("can put something else in a span's place", () => {
    const line = `x = "a" * 2; // see 'b'`;
    expect(blank(line, stringSpans(line), '""')).toBe(`x = "" * 2; // see ""`);
  });
});
