import { describe, expect, it } from "vitest";
import plugin, { verdictOf } from "./lint-plugin.ts";

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
});
