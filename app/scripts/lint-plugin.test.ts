import { describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import plugin, { diagnose, verdictOf } from "./lint-plugin.ts";

type Node = Record<string, unknown>;
const str = (value: string): Node => ({ type: "Literal", value });
const ident = (name: string): Node => ({ type: "Identifier", name });
const template = (...values: Node[]): Node => ({
  type: "TemplateLiteral",
  expressions: values,
  quasis: [{ value: { cooked: "x" } }],
});
const call = (kind: "NewExpression" | "CallExpression", ...args: Node[]): Node => ({
  type: kind,
  callee: ident("RegExp"),
  arguments: args,
});

/** The messages one rule reports for one node, as oxlint would hand it over. */
function reports(rule: keyof typeof plugin.rules, node: Node) {
  const messages: string[] = [];
  const visitors = plugin.rules[rule].create({ report: ({ message }) => messages.push(message) });
  const visit = visitors[String(node.type) as keyof typeof visitors];
  visit?.(node);
  return messages;
}

describe("the lint plugin", () => {
  describe("regexp-from-data", () => {
    it("reports a RegExp built from a function's input, as 0194 and 0195 did", () => {
      expect(reports("regexp-from-data", call("NewExpression", ident("pattern")))).toHaveLength(1);
      expect(reports("regexp-from-data", call("NewExpression", template(ident("local"))))).toHaveLength(1);
      expect(reports("regexp-from-data", call("CallExpression", ident("name")))).toHaveLength(1);
    });

    it("reports one built from a module's constant too", () => {
      expect(reports("regexp-from-data", call("NewExpression", template(ident("UNITS"))))).toHaveLength(1);
    });

    it("leaves a RegExp from fixed text, and other calls", () => {
      expect(reports("regexp-from-data", call("NewExpression", str("^a$")))).toEqual([]);
      expect(reports("regexp-from-data", call("NewExpression", template(), str("g")))).toEqual([]);
      const other = { type: "NewExpression", callee: ident("Map"), arguments: [ident("x")] };
      expect(reports("regexp-from-data", other)).toEqual([]);
    });
  });

  describe("slow-regexp", () => {
    const regex = (pattern: string, flags = ""): Node => ({ type: "Literal", regex: { pattern, flags } });

    it("reports a pattern that can backtrack for a very long time, and says how", () => {
      expect(reports("slow-regexp", regex("^(a+)+$"))).toEqual([expect.stringContaining("exponential")]);
      expect(reports("slow-regexp", regex("\\s*$"))).toEqual([expect.stringContaining("polynomial")]);
    });

    it("reports a fixed-text RegExp the same way", () => {
      expect(reports("slow-regexp", call("NewExpression", str("(\\w+\\s?)+$")))).toHaveLength(1);
    });

    it("reports a pattern recheck couldn't judge, as well as one it found slow", () => {
      expect(verdictOf({ status: "unknown" })).toContain("couldn't judge");
      expect(verdictOf({ status: "vulnerable", complexity: { type: "exponential" } })).toContain("exponential");
      expect(verdictOf({ status: "safe" })).toBeUndefined();
    });

    it("leaves a safe pattern, and a literal that isn't a regex", () => {
      expect(reports("slow-regexp", regex("^[a-z]+@[a-z]+\\.com$"))).toEqual([]);
      expect(reports("slow-regexp", call("NewExpression", str("^\\d{4}-\\d{2}$"), str("u")))).toEqual([]);
      expect(reports("slow-regexp", str("(a+)+"))).toEqual([]);
    });
  });

  describe("recheck's verdicts, kept between runs", () => {
    it("asks once per pattern, keeps the answer on disk, and reads it back", () => {
      const file = join(mkdtempSync(join(tmpdir(), "recheck-")), "kept.json");
      const ask = vi.fn(() => ({ status: "safe" }));
      const cache = {};
      expect(diagnose("^a$", "", { ask, cache, file })).toEqual({ status: "safe" });
      expect(diagnose("^a$", "", { ask, cache, file })).toEqual({ status: "safe" });
      expect(ask).toHaveBeenCalledTimes(1);
      expect(Object.values(JSON.parse(readFileSync(file, "utf8")))).toEqual([{ status: "safe" }]);
    });

    it("asks again for the same pattern under other flags", () => {
      const file = join(mkdtempSync(join(tmpdir(), "recheck-")), "kept.json");
      const ask = vi.fn(() => ({ status: "vulnerable", complexity: { type: "polynomial" } }));
      const cache = {};
      diagnose("a*a*$", "", { ask, cache, file });
      diagnose("a*a*$", "i", { ask, cache, file });
      expect(ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("in oxlint, with the app's own config", () => {
    it("finds a planted pattern of each kind, so an oxlint upgrade that drops the plugins fails here", () => {
      const file = join(mkdtempSync(join(tmpdir(), "planted-")), "planted.ts");
      const planted = [
        "export const fromData = (x: string) => new RegExp(x);",
        "export const slow = /^(a+)+$/;",
        "export const twice = /(a|a)x/;",
        "export const range = /[A-z]/;",
      ];
      writeFileSync(file, planted.join("\n") + "\n");
      const run = spawnSync("node_modules/.bin/oxlint", ["-c", ".oxlintrc.json", "-f", "json", file], {
        encoding: "utf8",
      });
      const codes = (JSON.parse(run.stdout) as { diagnostics: { code?: string }[] }).diagnostics.map((d) => d.code);
      expect(codes).toEqual(
        expect.arrayContaining([
          "xove(regexp-from-data)",
          "xove(slow-regexp)",
          "regexp(no-super-linear-backtracking)",
          "regexp(no-dupe-disjunctions)",
          "regexp(no-obscure-range)",
        ]),
      );
    });
  });
});
