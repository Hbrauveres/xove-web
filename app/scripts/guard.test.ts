import { describe, expect, it } from "vitest";
import {
  compare,
  countAll,
  type Finding,
  fromJscpd,
  fromKnip,
  fromOxlint,
  fromTsc,
  type Known,
  ownerOf,
  recordOf,
} from "./guard.ts";

const finding = (file: string, rule = "complexity", tool = "lint"): Finding => ({ tool, rule, file });
const known = (file: string, count: number, rule = "complexity", tool = "lint"): Known => ({
  tool,
  rule,
  file,
  count,
  owner: "#190",
});

describe("the guard: reading each tool", () => {
  it("reads TypeScript's errors, one per line, by code and file", () => {
    const out =
      "src/a.ts(3,5): error TS2532: Object is possibly 'undefined'.\n  more detail\nsrc/b.tsx(1,1): error TS2412: …\n";
    expect(fromTsc(out)).toEqual([finding("src/a.ts", "TS2532", "tsc"), finding("src/b.tsx", "TS2412", "tsc")]);
  });

  it("reads oxlint's, jscpd's and knip's JSON", () => {
    expect(fromOxlint('{"diagnostics":[{"code":"eslint(complexity)","filename":"src/a.ts"}]}')).toEqual([
      finding("src/a.ts", "eslint(complexity)"),
    ]);
    const copy = '{"duplicates":[{"firstFile":{"name":"src/a.ts"},"secondFile":{"name":"src/b.ts"}}]}';
    expect(fromJscpd(copy).map((f) => f.file)).toEqual(["src/a.ts", "src/b.ts"]);
    const knip = '{"issues":[{"file":"src/a.ts","files":[{}],"exports":[{},{}],"types":[{}]}]}';
    expect(fromKnip(knip).map((f) => f.rule)).toEqual(["file", "export", "export", "type"]);
  });

  it("fails loudly on output it can't read, instead of counting none", () => {
    expect(() => fromOxlint("Error: config not found")).toThrow();
  });
});

describe("the guard: the list that only shrinks", () => {
  it("passes when the code has exactly what the list records, and shows those as warnings", () => {
    const now = countAll([finding("src/a.ts"), finding("src/a.ts")]);
    const result = compare(now, [known("src/a.ts", 2)]);
    expect(result.errors).toEqual([]);
    expect(result.known.map((k) => k.count)).toEqual([2]);
  });

  it("fails on a finding the list doesn't allow, in an old file as in a new one", () => {
    expect(
      compare(countAll([finding("src/a.ts"), finding("src/a.ts"), finding("src/a.ts")]), [known("src/a.ts", 2)]).errors,
    ).toEqual([expect.stringMatching(/^new: src\/a\.ts: lint complexity, 3 \(the list allows 2\)/)]);
    expect(compare(countAll([finding("src/new.ts")]), []).errors).toEqual([
      expect.stringMatching(/^new: src\/new\.ts/),
    ]);
  });

  it("fails on a recorded finding that's gone, until the list is lowered", () => {
    expect(compare(countAll([finding("src/a.ts")]), [known("src/a.ts", 2)]).errors).toEqual([
      expect.stringMatching(/^fixed: src\/a\.ts/),
    ]);
  });

  it("fails when the list allows more than main's", () => {
    const now = countAll([finding("src/a.ts"), finding("src/a.ts")]);
    expect(compare(now, [known("src/a.ts", 2)], [known("src/a.ts", 1)]).errors).toEqual([
      expect.stringMatching(/^grown: src\/a\.ts/),
    ]);
    expect(compare(now, [known("src/a.ts", 2)], [known("src/a.ts", 3)]).errors).toEqual([]);
  });

  it("records today's counts, keeping each owner, but never a new finding", () => {
    const owners: [string, string][] = [["src/components/stage/", "#190 stage"]];
    const lowered = recordOf(countAll([finding("src/a.ts")]), [known("src/a.ts", 2)], owners);
    expect(lowered.list).toEqual([{ ...known("src/a.ts", 1) }]);
    expect(recordOf(countAll([finding("src/b.ts")]), [known("src/a.ts", 2)], owners).refused).toEqual([
      "src/b.ts: lint complexity",
    ]);
  });

  it("records the first list from scratch, each entry owned by the step for its folder", () => {
    const owners: [string, string][] = [
      ["src/components/", "#192 room"],
      ["src/components/stage/", "#190 stage"],
    ];
    const first = recordOf(countAll([finding("src/components/stage/Stage.tsx")]), [], owners);
    expect(first.list?.[0]?.owner).toBe("#190 stage");
    expect(ownerOf("src/somewhere/else.ts", owners)).toBe("#195 the sweep");
  });
});
