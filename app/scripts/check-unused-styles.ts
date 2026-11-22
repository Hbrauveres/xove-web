// What the stylesheets define and nothing reads: a CSS module's class its components never use, and a
// token (a custom property or a custom media in tokens.css) no stylesheet, other token or code reads.
// The guard runs it; `npm run check:styles-unused` prints it.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";

export const STYLE_RULES = {
  unusedClass: "a CSS module's class no component reads",
  unusedToken: "a token in tokens.css nothing reads",
} as const;
export type StyleRule = keyof typeof STYLE_RULES;
export type StyleFinding = { rule: StyleRule; file: string; line: number; name: string };

const TOKENS = "shared/styles/tokens.css";
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
/** A class in a selector: a dot, then a name that doesn't start with a digit; `:global(…)` left out. */
const CLASS = /\.(-?[_a-zA-Z][\w-]*)/g;
const lineOf = (text: string, at: number) => text.slice(0, at).split("\n").length;

/** The classes a module defines, each with the line it first appears on. */
function classesOf(css: string) {
  const clean = withoutComments(css)
    .replace(/url\([^)]*\)|(["'])(?:\\.|(?!\1)[^\\])*\1/g, (v) => v.replace(/[^\n]/g, " "))
    .replace(/:global\([^)]*\)/g, (g) => g.replace(/[^\n]/g, " "))
    .replace(/\{[^{}]*\}/g, (block) => block.replace(/[^\n]/g, " "));
  const classes = new Map<string, number>();
  for (const m of clean.matchAll(CLASS)) if (!classes.has(m[1] ?? "")) classes.set(m[1] ?? "", lineOf(clean, m.index));
  return classes;
}

/**
 * What one importer reads of a module: the names it reads, or "all" when it reads by a computed key or
 * hands the module on whole (to a helper that picks the classes).
 */
function readsOf(importer: string, local: string): Set<string> | "all" {
  const code = importer.replace(/^import\s.*$/gm, "");
  if (new RegExp(`\\b${local}\\[(?!\\s*["'\`])`).test(code)) return "all";
  if (new RegExp(`(?<![.\\w$])${local}\\b(?!\\s*[.[])`).test(code)) return "all";
  const names = new Set<string>();
  for (const m of code.matchAll(new RegExp(`\\b${local}(?:\\.([\\w$]+)|\\[\\s*["'\`]([^"'\`]+)["'\`]\\s*\\])`, "g")))
    names.add(m[1] ?? m[2] ?? "");
  return names;
}

function unusedClasses(files: Map<string, string>): StyleFinding[] {
  const reads = new Map<string, Set<string> | "all">();
  for (const [file, code] of files) {
    if (!/\.tsx?$/.test(file)) continue;
    for (const m of code.matchAll(/import\s+(?:\*\s+as\s+)?(\w+)\s+from\s+["']([^"']+\.module\.css)["']/g)) {
      const module = normalize(join(dirname(file), m[2] ?? ""));
      const before = reads.get(module) ?? new Set<string>();
      const now = readsOf(code, m[1] ?? "");
      reads.set(module, before === "all" || now === "all" ? "all" : new Set([...before, ...now]));
    }
  }
  return [...files].flatMap(([file, css]) => {
    if (!file.endsWith(".module.css")) return [];
    const read = reads.get(file) ?? new Set<string>();
    if (read === "all") return [];
    return [...classesOf(css)]
      .filter(([name]) => !read.has(name))
      .map(([name, line]) => ({ rule: "unusedClass" as const, file, line, name }));
  });
}

function unusedTokens(files: Map<string, string>): StyleFinding[] {
  const tokens = files.get(TOKENS);
  if (tokens === undefined) return [];
  const clean = withoutComments(tokens);
  const defined = [...clean.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:|@custom-media\s+(--[\w-]+)/g)].map((m) => ({
    name: m[1] ?? m[2] ?? "",
    line: lineOf(clean, m.index),
  }));
  // Where a token can be read: every other file, and tokens.css with its definitions taken out.
  const readers = [
    ...[...files].filter(([f]) => f !== TOKENS).map(([, text]) => text),
    clean.replace(/(--[\w-]+)\s*:/g, ":").replace(/@custom-media\s+--[\w-]+/g, ""),
  ].join("\n");
  return defined
    .filter(({ name }) => !new RegExp(`${name}(?![\\w-])`).test(readers))
    .map(({ name, line }) => ({ rule: "unusedToken" as const, file: TOKENS, line, name }));
}

/** Every unused class and token in a set of files (paths relative to src → their text). */
export function unusedStyles(files: Map<string, string>): StyleFinding[] {
  return [...unusedClasses(files), ...unusedTokens(files)];
}

const walk = (p: string): string[] =>
  statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => walk(join(p, n))) : [p];

/** The findings under `src`: its stylesheets and code. */
export function checkUnusedStyles(src: string): StyleFinding[] {
  if (!existsSync(src)) return [];
  const files = new Map(
    walk(src)
      .filter((f) => /\.(css|tsx?)$/.test(f))
      .map((f) => [relative(src, f), readFileSync(f, "utf8")] as const),
  );
  return unusedStyles(files);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = checkUnusedStyles(resolve("src"));
  for (const [rule, what] of Object.entries(STYLE_RULES)) {
    const list = findings.filter((f) => f.rule === rule);
    if (!list.length) continue;
    console.log(`\n${what}: ${list.length}`);
    for (const f of list) console.log(`  src/${f.file}:${f.line}  ${f.name}`);
  }
  console.log(`\n${findings.length ? findings.length + " findings" : "No findings"} under src.`);
}
