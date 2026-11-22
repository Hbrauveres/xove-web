import { describe, expect, it } from "vitest";
import { blank, commentSpans, stringSpans, withoutComments } from "./text-scan.ts";

describe("scanning a text for strings and comments", () => {
  it("finds each quoted string, an escaped quote staying inside", () => {
    const line = `say("it's \\"fine\\"", 'a', \`b\`)`;
    expect(stringSpans(line).map(([from, to]) => line.slice(from, to))).toEqual([`"it's \\"fine\\""`, "'a'", "`b`"]);
  });

  it("runs an unclosed string to the end, and reads only the quotes it's given", () => {
    expect(stringSpans(`a "b`)).toEqual([[2, 4]]);
    expect(stringSpans("it's `x`", "\"'")).toEqual([[2, 8]]);
  });

  it("blanks a CSS comment, keeping its line breaks, and leaves an unclosed one", () => {
    expect(withoutComments("a /* b\nc */ d")).toBe("a     \n     d");
    expect(commentSpans("a /* b")).toEqual([]);
  });

  it("can put something else in a span's place", () => {
    const line = `x = "a" * 2; // see 'b'`;
    expect(blank(line, stringSpans(line), '""')).toBe(`x = "" * 2; // see ""`);
  });
});
