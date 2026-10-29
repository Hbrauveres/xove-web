// The code check: the code-quality rules a script can measure (the workspace's code-quality skill
// lists them all). Run from app/: npm run check:code [-- <folder> --all --json]. The guard
// (npm run guard) runs it with --json and compares its counts with checks/known-findings.json.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

export const RULES = {
  size: "over 300 lines (one job per file)",
  noTest:
    "code with logic but no .test file where it belongs (its module's tests/ folder, or beside it in the old folders)",
  testName: "test named .spec (rename to .test: a spec is a workspace requirement document)",
  orphanTest: "test file with no file of the same name where it belongs",
  testPlace: "test beside its file: it goes in its module's tests/ folder, at the same path",
  partPlace: "a utils, constants, types or enum file outside its kind's folder (utils/, constants/, types/, enums/)",
  partInCode:
    "a type, named constant or helper inside working code: types to types/, constants to constants/, helpers to utils/",
  literal: "literal colour, duration or easing in CSS (use a token)",
  domQuery:
    "querySelector/closest/getElementById in a component: finding other parts through the page (pass a ref or context)",
  crossCss: "CSS module imported from another folder",
  livekit: "livekit-client imported outside core/",
  history: "spec, issue or decision number in a comment (history belongs in commits and docs)",
  mutable: "module-level mutable export (export let/var)",
  structure: "outside the folder structure (app/ core/ shared/ features/ test/)",
  naming: "file name not kebab-case with a type suffix",
  realWait: "test waits in real time: a sleep or a waitFor/findBy timeout over 1 s (use fake timers and a fixed clock)",
  sharedData: "test data or let shared at file level (build it per test with a factory)",
  cssText: "test reads CSS as text (check that tokens are used, or check in the browser)",
  disable: "a comment that switches a check off (oxlint-disable, @ts-ignore, @ts-expect-error…): fix the code instead",
  lineLength: "a line over 120 characters (Prettier doesn't wrap strings and comments: break them yourself)",
} as const;

export type Rule = keyof typeof RULES;
export type Finding = { rule: Rule; file: string; line: number; text: string };

/** Prettier's width (.prettierrc.json): what it can't wrap must stay inside it too. */
const MAX_LINE = 120;
const isTest = (f: string) => /\.(spec|test)\.tsx?$/.test(f);
const isCode = (f: string) => /\.tsx?$/.test(f) && !isTest(f) && !f.endsWith(".d.ts");
const noLogic = (f: string) =>
  /(\.types|\.enum|\.constants)\.ts$/.test(f) ||
  /(^|\/)index\.ts$/.test(f) ||
  /(^|\/)test\//.test(f) ||
  /(^|\/)(vite-env|setup)\.ts$/.test(f);
/**
 * The module a file of the new structure belongs to (`app`, `shared`, `core/<name>`,
 * `features/<name>`), and its path inside it; null for the old folders and `test/`.
 */
function moduleOf(r: string): { root: string; rest: string } | null {
  const parts = r.split("/");
  const depth =
    parts[0] === "core" || parts[0] === "features" ? 2 : parts[0] === "app" || parts[0] === "shared" ? 1 : 0;
  if (!depth || parts.length <= depth) return null;
  return { root: parts.slice(0, depth).join("/"), rest: parts.slice(depth).join("/") };
}

/** Where a file's test lives: its module's tests/ folder at the same path, or beside it in the old folders. */
function testStemOf(r: string): string {
  const stem = r.replace(/\.tsx?$/, "");
  const m = moduleOf(stem);
  return m ? `${m.root}/tests/${m.rest}` : stem;
}

/** Where a test's file lives: the same path outside tests/, or beside it in the old folders. */
function codeStemOf(r: string): string {
  const stem = r.replace(/\.(spec|test)\.tsx?$/, "");
  const m = moduleOf(stem);
  return m?.rest.startsWith("tests/") ? `${m.root}/${m.rest.slice("tests/".length)}` : stem;
}

/** Each kind of part, and the folder it lives in. */
const PART_FOLDERS: Record<string, string> = { util: "utils", constants: "constants", types: "types", enum: "enums" };
const partOf = (r: string) => /\.(util|constants|types|enum)\.ts$/.exec(r)?.[1];

/** Working code: what makes the app work, as opposed to its parts, its tests and the shared test fakes. */
const isWorking = (r: string) => isCode(r) && !noLogic(r) && !partOf(r);

/** A type, named constant or helper declared at the top of a working file; a hook's, component's or page's only job is its export. */
const PART_DECLARATION = [
  /^\s*(export )?(declare )?(type|interface|enum) \w+\b(<[^>]*>)?\s*(=|\{|extends)/,
  /^(export )?const [A-Z][A-Z0-9_]*\b(?![a-z])\s*(:[^=]+)?=/,
  /^(async )?function\*? \w/,
  /^(let|var) \w/,
  /^const [a-z]\w*\s*(:[^=]+)?=\s*(async\s*)?(function\b|\(|<|\w+\s*=>)/,
  /^const \w+\s*(:[^=]+)?=\s*(["'`[{\d-]|true\b|false\b|null\b)/,
];
/** A class kept to itself: a helper, except in a service, an adapter or a store, where the class is the job. */
const HELPER_CLASS = /^class \w/;
const HELPER_EXPORT = [
  /^export (async )?function (?!use[A-Z])[a-z]/,
  /^export const (?!use[A-Z])[a-z]\w*\s*=\s*(async\s*)?\(/,
];
/** A function's or method's signature with an object type written in it. */
const SIGNATURE = /function |=>|^\s+(?:(?:private|public|protected|async|static|readonly)\s+)*#?\w+\s*[(<]/;
const INLINE_TYPE = /:\s*\{\s*\w+\??\s*:|:\s*\{\s*$/;
/** An object type written anywhere: a type argument, a cast, or props typed after a destructured parameter. */
const INLINE_TYPE_ANYWHERE = /(<|\bas\s+)\{\s*\w+\??\s*:|^\s*\}\s*:\s*\{/;

/**
 * A part outside its kind's folder (or in one that isn't right under its module), or working code
 * inside a parts folder.
 */
function misplacedPart(r: string): boolean {
  const part = partOf(r);
  const folder = r.split("/").at(-2) ?? "";
  if (!part) return /\.tsx?$/.test(r) && Object.values(PART_FOLDERS).includes(folder);
  if (folder !== PART_FOLDERS[part]) return true;
  const m = moduleOf(r);
  return m !== null && !m.rest.startsWith(`${folder}/`);
}

const isTokenFile = (f: string) => /(^|\/)(tokens|global)\.css$/.test(f);
const NAME =
  /^[a-z0-9]+(-[a-z0-9]+)*\.(component|page|hook|util|service|adapter|store|model|selectors|constants|enum|types|factory)(\.module)?\.(tsx?|css)$|^[a-z0-9]+(-[a-z0-9]+)*\.(component|page|hook|util|service|adapter|store|model|selectors)\.test\.tsx?$|^(tokens|global)\.css$/;

// Findings of one file, from its path (relative to src) and its text: [{ rule, line, text }].
export function analyse(r: string, text: string, exists: (path: string) => boolean): Finding[] {
  const out: Finding[] = [];
  const add = (rule: Rule, line = 0, t = "") => out.push({ rule, file: r, line, text: t.trim().slice(0, 90) });
  const top = r.split("/")[0];
  if (!/\.(tsx?|css)$/.test(r)) return out;
  if (r.includes("/") && !["app", "core", "shared", "features", "test"].includes(top)) add("structure");
  if (!/(^|\/)index\.ts$/.test(r) && !/^(main|vite-env\.d)\.tsx?$/.test(r) && !NAME.test(basename(r))) add("naming");
  const lines = text.split("\n");
  if (isCode(r) && lines.length > 300) add("size", 0, `${lines.length} lines`);
  if (isCode(r) && !noLogic(r)) {
    const stem = testStemOf(r);
    const test = [".test.ts", ".test.tsx"].some((e) => exists(stem + e));
    const spec = [".spec.ts", ".spec.tsx"].some((e) => exists(stem + e));
    if (!test && !spec) add("noTest");
    else if (!test) add("testName");
  }
  if (isTest(r) && !/(^|\/)test\//.test(r)) {
    const m = moduleOf(r);
    if (m && !(m.rest.startsWith("tests/") && !m.rest.slice("tests/".length).split("/").includes("tests")))
      add("testPlace");
    if (![".ts", ".tsx"].some((e) => exists(codeStemOf(r) + e))) add("orphanTest");
  }
  if (!isTest(r) && misplacedPart(r)) add("partPlace");
  const working = isWorking(r) && top !== "test";
  const jobOnly = /\.(component|page|hook)\.tsx?$/.test(r);
  lines.forEach((l, i) => {
    const n = i + 1,
      comment = /^\s*(\/\/|\*|\/\*)/.test(l) || /\/\/ /.test(l) || /\/\*/.test(l);
    if (
      r.endsWith(".css") &&
      !isTokenFile(r) &&
      !/^\s*(\/\*|\*)/.test(l) &&
      /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\b\d+(\.\d+)?m?s\b|cubic-bezier\(/.test(l)
    )
      add("literal", n, l);
    if (isCode(r) && r.endsWith(".tsx") && /\.(querySelector|querySelectorAll|getElementById|closest)\(/.test(l))
      add("domQuery", n, l);
    if (isCode(r) && /from\s+["']\.\.\/[^"']*\.module\.css["']/.test(l)) add("crossCss", n, l);
    if (isCode(r) && /from\s+["']livekit-client["']/.test(l) && top !== "core") add("livekit", n, l);
    if (comment && /\b[Ss]pecs? 0\d{3}|\bADR-\d{4}|#\d{2,4}\b|[Dd]esign decision \d+|\bround \d+/.test(l))
      add("history", n, l);
    if (isCode(r) && /^export (let|var) /.test(l)) add("mutable", n, l);
    if (
      working &&
      (PART_DECLARATION.some((re) => re.test(l)) ||
        (jobOnly && HELPER_EXPORT.some((re) => re.test(l))) ||
        (!/\.(service|adapter|store)\.ts$/.test(r) && HELPER_CLASS.test(l)) ||
        (SIGNATURE.test(l) && INLINE_TYPE.test(l)) ||
        INLINE_TYPE_ANYWHERE.test(l))
    )
      add("partInCode", n, l);
    if (
      isTest(r) &&
      /setTimeout\(\s*r(esolve)?\s*,|\bsleep\(|\bwait\(\s*\d|timeout:\s*(1\d{3,}|[2-9]\d{3,}|\d{5,})|\},\s*\d{4,}\)\s*;?\s*$/.test(
        l,
      ) &&
      !/timeout:\s*1000\b/.test(l)
    )
      add("realWait", n, l);
    if (
      isTest(r) &&
      (/^let \w/.test(l) ||
        /^const \w+(:[^=]+)?\s*=\s*(new |(?!vi\.mock\b|Date\.parse\("[^"]*"\))[a-zA-Z_][\w.]*\()/.test(l))
    )
      add("sharedData", n, l);
    if (isTest(r) && /readFileSync\(|\?raw["']/.test(l)) add("cssText", n, l);
    if (isCode(r) && /(oxlint|eslint)-disable|@ts-(ignore|expect-error|nocheck)|jscpd:ignore|prettier-ignore/.test(l))
      add("disable", n, l);
    if (isCode(r) && l.length > MAX_LINE) add("lineLength", n, `${l.length} characters`);
  });
  return out;
}

const walk = (p: string): string[] =>
  statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => (n === "node_modules" ? [] : walk(join(p, n)))) : [p];

/** Every finding under `src` (paths relative to it), or under one folder or file of it. */
export function checkCode(src: string, target = src): Finding[] {
  return walk(target).flatMap((f) =>
    analyse(relative(src, f), readFileSync(f, "utf8"), (y) => existsSync(join(src, y))),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const src = resolve("src");
  const target = resolve(args.find((a) => !a.startsWith("--")) ?? src);
  const findings = checkCode(src, target);
  if (args.includes("--json")) {
    console.log(JSON.stringify(findings));
  } else {
    for (const [rule, what] of Object.entries(RULES)) {
      const list = findings.filter((x) => x.rule === rule);
      if (!list.length) continue;
      console.log(`\n${what}: ${list.length}`);
      for (const x of args.includes("--all") ? list : list.slice(0, 15))
        console.log(`  ${x.file}${x.line ? ":" + x.line : ""}${x.text ? "  " + x.text : ""}`);
      if (!args.includes("--all") && list.length > 15) console.log(`  … ${list.length - 15} more (--all)`);
    }
    console.log(
      `\n${findings.length ? findings.length + " findings" : "No findings"} under ${relative(src, target) || "src"}.`,
    );
  }
  process.exitCode = findings.length && !args.includes("--json") ? 1 : 0;
}
