// The project's own lint rules, loaded by oxlint as a JS plugin (.oxlintrc.json, "jsPlugins"):
// - regexp-from-data: a RegExp whose pattern isn't fixed text. A pattern built from data can be made
//   to run for a very long time, and Semgrep (the commit checks' SAST) fails it; caught here first.
// - slow-regexp: every regular expression asked of recheck, which says whether some input can make
//   it backtrack for a very long time (ReDoS). Anything but "safe" is reported, an undecided one too.
// oxlint reads a plugin from its module's default export, as ESLint does.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { checkSync } from "recheck";

/** How long recheck may think about one pattern; an ordinary one takes a couple of milliseconds. */
const RECHECK_TIMEOUT_MS = 10_000;
/**
 * Where recheck's verdicts are kept between runs: asking it about every pattern each time takes about 15 s.
 * A pattern is asked again when it changes, or when recheck does (its version is in the key). Deleting the
 * file asks about every pattern again; XOVE_RECHECK_CACHE names another file (the tests use their own).
 */
const cacheFile = () =>
  process.env["XOVE_RECHECK_CACHE"] ?? join(process.cwd(), "node_modules", ".cache", "xove-recheck.json");

/** The few parts of oxlint's syntax tree the rules read. */
type AstNode = {
  type: string;
  name?: string;
  value?: unknown;
  callee?: AstNode;
  object?: AstNode;
  id?: AstNode;
  init?: AstNode;
  property?: AstNode;
  arguments?: AstNode[];
  expressions?: AstNode[];
  quasis?: { value: { cooked?: string } }[];
  regex?: { pattern: string; flags: string };
};
/** What recheck answers about one pattern. */
type Diagnosis = { status: string; complexity?: { type: string } };
type Ask = (pattern: string, flags: string, options: { timeout: number }) => Diagnosis;
type Context = { report: (diagnostic: { node: AstNode; message: string }) => void };

/** Fixed text: a plain string, or a template with nothing put into it. */
const isFixedText = (node: AstNode | undefined) =>
  (node?.type === "Literal" && typeof node.value === "string") ||
  (node?.type === "TemplateLiteral" && node.expressions?.length === 0);

/** `RegExp(…)` or `new RegExp(…)`, also through the global object (`window.RegExp`, `globalThis.RegExp`). */
const isRegExpCall = (node: AstNode) =>
  (node.callee?.type === "Identifier" && node.callee.name === "RegExp") ||
  (node.callee?.type === "MemberExpression" && node.callee.property?.name === "RegExp");

/** A string's `match`, `matchAll` or `search`: given a string, JavaScript makes it a RegExp. */
const isStringSearch = (node: AstNode) =>
  node.type === "CallExpression" &&
  node.callee?.type === "MemberExpression" &&
  ["match", "matchAll", "search"].includes(node.callee.property?.name ?? "");

const isRegexLiteral = (node: AstNode | undefined) => node?.type === "Literal" && node.regex !== undefined;

const regexpFromData = {
  meta: { type: "problem", docs: { description: "a RegExp whose pattern isn't fixed text" } },
  create(context: Context) {
    /** Names the file binds to a regex literal: searching with one is searching with a fixed pattern. */
    const regexNames = new Set<string>();
    /** Searches with a name, decided at the end of the file, once every binding is known. */
    const named: { node: AstNode; name: string }[] = [];
    const report = (node: AstNode) =>
      context.report({ node, message: "A RegExp built from data: write the pattern as fixed text." });
    const check = (node: AstNode) => {
      const [pattern] = node.arguments ?? [];
      if (!pattern || isFixedText(pattern) || isRegexLiteral(pattern)) return;
      if (isRegExpCall(node)) report(node);
      else if (isStringSearch(node) && pattern.type === "Identifier") named.push({ node, name: pattern.name ?? "" });
      else if (isStringSearch(node)) report(node);
    };
    return {
      NewExpression: check,
      CallExpression: check,
      VariableDeclarator: (node: AstNode) => {
        if (node.id?.type === "Identifier" && isRegexLiteral(node.init)) regexNames.add(node.id.name ?? "");
      },
      "Program:exit": () => {
        for (const { node, name } of named) if (!regexNames.has(name)) report(node);
      },
    };
  },
};

/** The fixed text a node holds, if it's fixed text. */
const textOf = (node: AstNode | undefined) =>
  node?.type === "Literal" ? String(node.value) : (node?.quasis?.[0]?.value.cooked ?? "");

/** The message for recheck's answer, or nothing when the pattern is safe. */
export function verdictOf(diagnosis: Diagnosis) {
  if (diagnosis.status === "safe") return undefined;
  if (diagnosis.status === "vulnerable")
    return `A regular expression some input can make very slow (${diagnosis.complexity?.type ?? "?"} backtracking): rewrite it.`;
  return `A regular expression recheck couldn't judge (${diagnosis.status}): rewrite it simpler.`;
}

/** recheck's version, from its own package file: part of each kept verdict's key. */
function recheckVersion() {
  try {
    const file = createRequire(import.meta.url).resolve("recheck/package.json");
    return String(JSON.parse(readFileSync(file, "utf8")).version);
  } catch {
    return "unknown";
  }
}

/** The kept verdicts; unreadable, missing or not a set of verdicts, an empty set to fill. */
function readCache(file: string): Record<string, Diagnosis> {
  try {
    const read: unknown = JSON.parse(readFileSync(file, "utf8"));
    return typeof read === "object" && read !== null && !Array.isArray(read) ? { ...read } : {};
  } catch {
    return {};
  }
}

/** Each cache file's verdicts, read once per process. */
const opened = new Map<string, Record<string, Diagnosis>>();
const keptIn = (file: string) => opened.get(file) ?? opened.set(file, readCache(file)).get(file) ?? {};

/** recheck's verdict on a pattern: kept from an earlier run, or asked now and kept. */
export function diagnose(
  pattern: string,
  flags: string,
  {
    ask = checkSync,
    file = cacheFile(),
    cache = keptIn(file),
  }: { ask?: Ask; cache?: Record<string, Diagnosis>; file?: string } = {},
): Diagnosis {
  const key = `${VERSION}\u0000${flags}\u0000${pattern}`;
  const kept = cache[key];
  if (kept) return kept;
  const { status, complexity } = ask(pattern, flags, { timeout: RECHECK_TIMEOUT_MS });
  const fresh: Diagnosis = complexity ? { status, complexity: { type: complexity.type } } : { status };
  cache[key] = fresh;
  try {
    mkdirSync(dirname(file), { recursive: true });
    const temp = `${file}.${process.pid}`;
    writeFileSync(temp, JSON.stringify({ ...readCache(file), [key]: fresh }));
    renameSync(temp, file);
  } catch {
    // A cache that can't be written only costs time.
  }
  return fresh;
}
const VERSION = recheckVersion();

const slowRegexp = {
  meta: { type: "problem", docs: { description: "a regular expression some input can make very slow" } },
  create(context: Context) {
    const ask = (node: AstNode, pattern: string, flags: string) => {
      const message = verdictOf(diagnose(pattern, flags));
      if (message) context.report({ node, message });
    };
    /** A pattern written as fixed text: `RegExp("…")`, or a string a search makes a RegExp of. */
    const fixedText = (node: AstNode) => {
      const [pattern, flags] = node.arguments ?? [];
      if ((isRegExpCall(node) || isStringSearch(node)) && isFixedText(pattern))
        ask(node, textOf(pattern), isRegExpCall(node) && flags ? textOf(flags) : "");
    };
    return {
      Literal: (node: AstNode) => {
        if (node.regex) ask(node, node.regex.pattern, node.regex.flags);
      },
      NewExpression: (node: AstNode) => fixedText(node),
      CallExpression: (node: AstNode) => fixedText(node),
    };
  },
};

export default {
  meta: { name: "xove" },
  rules: { "regexp-from-data": regexpFromData, "slow-regexp": slowRegexp },
};
