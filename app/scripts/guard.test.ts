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
  newRulesOf,
  renamed,
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
    // jscpd 5 names files from the scanned folder: the same findings, at the same paths.
    const five = '{"duplicates":[{"firstFile":{"name":"a.ts"},"secondFile":{"name":"components/b.ts"}}]}';
    expect(fromJscpd(five).map((f) => f.file)).toEqual(["src/a.ts", "src/components/b.ts"]);
    const knip = '{"issues":[{"file":"src/a.ts","files":[{}],"exports":[{},{}],"types":[{}]}]}';
    expect(fromKnip(knip).map((f) => f.rule)).toEqual(["files", "exports", "exports", "types"]);
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

  it("lets a code rule main's check doesn't have record its findings, once, and nothing else grow", () => {
    const owners: [string, string][] = [["src/components/", "#192 room"]];
    const fresh = new Set(["partPlace"]);
    const now = countAll([finding("src/components/a.ts", "partPlace", "code"), finding("src/b.ts")]);
    const listed = recordOf(now, [known("src/b.ts", 1)], owners, fresh);
    expect(listed.list?.map((k) => `${k.file} ${k.rule} ${k.owner}`)).toEqual([
      "src/components/a.ts partPlace #192 room",
      "src/b.ts complexity #190",
    ]);
    expect(compare(now, listed.list ?? [], [known("src/b.ts", 1)], fresh).errors).toEqual([]);
    expect(compare(now, listed.list ?? [], [known("src/b.ts", 1)]).errors).toEqual([
      expect.stringMatching(/^grown: src\/components\/a\.ts/),
    ]);
    expect(recordOf(countAll([finding("src/c.ts")]), [known("src/b.ts", 1)], owners, fresh).refused).toEqual([
      "src/c.ts: lint complexity",
    ]);
  });

  it("never lets a new rule's findings into the new structure", () => {
    const fresh = new Set(["partPlace"]);
    const now = countAll([finding("src/features/room/a.ts", "partPlace", "code"), finding("src/b.ts")]);
    expect(recordOf(now, [known("src/b.ts", 1)], [], fresh).refused).toEqual([
      "src/features/room/a.ts: code partPlace",
    ]);
    const listed = [known("src/features/room/a.ts", 1, "partPlace", "code")];
    expect(
      compare(countAll([finding("src/features/room/a.ts", "partPlace", "code")]), listed, [], fresh).errors,
    ).toEqual([expect.stringMatching(/^grown: src\/features\/room\/a\.ts/)]);
  });

  it("knows a rule is new when main's code check doesn't define it, and treats none as new without main's", () => {
    const mainCheck = 'export const RULES = {\n  size: "over 300 lines",\n  noTest: "no test",\n} as const;\n';
    expect([...newRulesOf(mainCheck, ["size", "noTest", "partPlace"])]).toEqual(["partPlace"]);
    expect([...newRulesOf(undefined, ["size", "partPlace"])]).toEqual([]);
    const spread = 'export const RULES = {\n  size: "over 300 lines",\n  ...LAYOUT_RULES,\n} as const;\n';
    const layout = 'export const LAYOUT_RULES = {\n  nested: "a folder inside a part folder",\n} as const;\n';
    expect([...newRulesOf(`${spread}\n${layout}`, ["size", "nested"])]).toEqual([]);
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

  it("fails when a tool that had findings suddenly reports none, and won't record that", () => {
    const now = countAll([finding("src/a.ts")]);
    const recorded = [known("src/a.ts", 1), known("src/b.ts", 3, "TS2532", "tsc")];
    expect(compare(now, recorded).errors).toContain(
      "silent: tsc reported nothing, against 3 recorded; check that it still runs",
    );
    expect(recordOf(now, recorded, []).refused).toEqual([
      "silent: tsc reported nothing, against 3 recorded; check that it still runs",
    ]);
  });

  it("reads every kind of unused code knip reports", () => {
    const knip =
      '{"issues":[{"file":"src/a.ts","files":[],"exports":[],"types":[],"enumMembers":[{}],"namespaceMembers":[{}],"duplicates":[{}]}]}';
    expect(fromKnip(knip).map((f) => f.rule)).toEqual(["enumMembers", "namespaceMembers", "duplicates"]);
  });

  it("follows a file main's list names under its old path", () => {
    const moves = "R100\tapp/src/test/fake.ts\tapp/src/testing/fake.ts\nM\tapp/src/a.ts";
    expect(renamed([known("src/test/fake.ts", 2), known("src/a.ts", 1)], moves).map((k) => k.file)).toEqual([
      "src/testing/fake.ts",
      "src/a.ts",
    ]);
  });
});
