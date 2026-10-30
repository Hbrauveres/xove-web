import { describe, expect, it } from "vitest";
import { asRecorded, compare, report, type Recording } from "./look-compare.ts";

const screen = (styles: Record<string, string>): Recording => ({ "1920x1080 home": { "body>main>p": styles } });

describe("the looks-the-same comparison", () => {
  it("finds nothing between two recordings of the same look", () => {
    expect(
      compare(
        screen({ padding: "12px", color: "rgb(235, 235, 236)" }),
        screen({ padding: "12px", color: "rgb(235, 235, 236)" }),
      ),
    ).toEqual([]);
  });

  it("names the screen, element, property and both values of a change", () => {
    expect(compare(screen({ padding: "12px" }), screen({ padding: "14px" }))).toEqual([
      { screen: "1920x1080 home", element: "body>main>p", property: "padding", before: "12px", after: "14px" },
    ]);
  });

  it("names an element that's gone or new", () => {
    const main: Recording = { s: { a: {}, b: {} } };
    const branch: Recording = { s: { a: {}, c: {} } };
    expect(compare(main, branch).map((d) => `${d.element} ${d.before}→${d.after}`)).toEqual(["b there→—", "c —→there"]);
  });

  it("takes a CSS module's keyframes by their name, not their file's hash", () => {
    const before = asRecorded({ "animation-name": "_tick-in_qw0rb_1" });
    const after = asRecorded({ "animation-name": "_tick-in_8nu1p_1" });
    expect(compare({ s: { e: before } }, { s: { e: after } })).toEqual([]);
  });

  it("reports what it compared with, and tells a look change from an accident", () => {
    const one = compare(screen({ padding: "12px" }), screen({ padding: "14px" }));
    expect(report([], "`main` at abc1234", false)).toContain("Looks the same");
    expect(report(one, "`main` at abc1234", false)).toMatch(/1 differences.*`main` at abc1234.*label it `look change`/);
    expect(report(one, "`main` at abc1234", true)).toContain("expected: this PR is labelled `look change`");
    expect(report(one, "`main` at abc1234", false)).toContain(
      "| 1920x1080 home | `body>main>p` | padding | `12px` | `14px` |",
    );
  });
});
