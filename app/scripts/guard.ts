// The guard rails: every check on the whole app, compared with checks/known-findings.json, the list of
// what today's code still breaks. That list may only shrink (docs/architecture.md, "The checks").
// Run from app/: npm run guard [-- --all] to check; npm run guard -- --record to lower the list after
// a fix. Fails on a finding the list doesn't allow, on a listed finding that's gone, and on a list
// longer than main's.
import { execFile } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { promisify } from "node:util";
import { checkCode, RULES } from "./check-code.ts";

const run = promisify(execFile);
const KNOWN = "checks/known-findings.json";
const OWNERS = "checks/owners.json";
const JSCPD_REPORT = "node_modules/.tmp/jscpd/jscpd-report.json";

/** One finding, as the guard counts it: which tool, which of its rules, in which file. */
export type Finding = { tool: string; rule: string; file: string };
/** A recorded count: how many findings of one rule one file may still have, and who clears them. */
export type Known = { tool: string; rule: string; file: string; count: number; owner: string };

const keyOf = (f: { tool: string; rule: string; file: string }) => `${f.tool}:${f.rule}|${f.file}`;

/** TypeScript's `--pretty false` lines: `src/a.ts(3,5): error TS2532: …`. */
export function fromTsc(output: string): Finding[] {
  return [...output.matchAll(/^(.+?)\(\d+,\d+\): error (TS\d+):/gm)].map(([, file = "", rule = ""]) => ({
    tool: "tsc",
    rule,
    file,
  }));
}

/** oxlint's `-f json`: `{ diagnostics: [{ code: "eslint(complexity)", filename }] }`. */
export function fromOxlint(json: string): Finding[] {
  const { diagnostics } = JSON.parse(json) as { diagnostics: { code?: string; filename: string }[] };
  // A file the linter can't parse has no rule: it's still a finding, and a loud one.
  return diagnostics.map((d) => ({ tool: "lint", rule: d.code ?? "parse-error", file: d.filename }));
}

/** jscpd's report: each copied block counts once in each file that holds it. */
export function fromJscpd(json: string): Finding[] {
  const { duplicates } = JSON.parse(json) as {
    duplicates: { firstFile: { name: string }; secondFile: { name: string } }[];
  };
  return duplicates.flatMap((d) =>
    [d.firstFile.name, d.secondFile.name].map((file) => ({ tool: "copies", rule: "copied-block", file })),
  );
}

/** knip's `--reporter json`: dead files, unused exports and unused types, per file. */
export function fromKnip(json: string): Finding[] {
  const KINDS = ["files", "exports", "types", "enumMembers", "namespaceMembers", "duplicates"] as const;
  const { issues } = JSON.parse(json) as {
    issues: (Record<(typeof KINDS)[number], unknown[] | undefined> & { file: string })[];
  };
  return issues.flatMap((i) =>
    KINDS.flatMap((kind) => (i[kind] ?? []).map(() => ({ tool: "unused", rule: kind, file: i.file }))),
  );
}

/** The step that clears a file's findings: the longest matching path prefix in checks/owners.json. */
export function ownerOf(file: string, owners: [string, string][]) {
  const match = owners.filter(([prefix]) => file.startsWith(prefix)).sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1] ?? "#195 the sweep";
}

/** Findings counted per tool, rule and file. */
export function countAll(findings: Finding[]) {
  const counts = new Map<string, Known>();
  for (const f of findings) {
    const k = keyOf(f);
    const was = counts.get(k);
    counts.set(k, { ...f, count: (was?.count ?? 0) + 1, owner: was?.owner ?? "" });
  }
  return counts;
}

/**
 * What the guard says about today's counts against the record (and against main's record):
 * `errors` fail the run, `known` are the recorded findings still there, shown as warnings.
 */
export function compare(now: Map<string, Known>, known: Known[], main?: Known[], fresh = new Set<string>()) {
  const errors: string[] = [];
  const record = new Map(known.map((k) => [keyOf(k), k]));
  for (const [k, n] of now) {
    const allowed = record.get(k)?.count ?? 0;
    if (n.count > allowed)
      errors.push(`new: ${n.file}: ${n.tool} ${n.rule}, ${n.count} (the list allows ${allowed}); fix it`);
  }
  for (const [k, r] of record) {
    const n = now.get(k)?.count ?? 0;
    if (n < r.count)
      errors.push(
        `fixed: ${r.file}: ${r.tool} ${r.rule}, ${n} (the list says ${r.count}); run npm run guard -- --record`,
      );
  }
  // A tool that suddenly reports nothing it used to has most likely stopped working (a setting lost,
  // its output changed), not had everything fixed at once: that must not pass as a clean-up.
  for (const tool of new Set(known.map((k) => k.tool))) {
    const before = known.filter((k) => k.tool === tool).reduce((s, k) => s + k.count, 0);
    const after = [...now.values()].filter((n) => n.tool === tool).reduce((s, n) => s + n.count, 0);
    if (before > 0 && after === 0)
      errors.push(`silent: ${tool} reported nothing, against ${before} recorded; check that it still runs`);
  }
  if (main) {
    const before = new Map(main.map((k) => [keyOf(k), k.count]));
    for (const [k, r] of record)
      if (r.count > (before.get(k) ?? 0) && !isFresh(r, fresh))
        errors.push(
          `grown: ${r.file}: ${r.tool} ${r.rule}, ${r.count} on the list (main's allows ${before.get(k) ?? 0}); the list only shrinks`,
        );
  }
  const knownStill = [...now.values()].filter((n) => (record.get(keyOf(n))?.count ?? 0) > 0);
  return { errors, known: knownStill };
}

/** A finding of a code rule that main's code check doesn't define yet: the PR adding it records it once. */
const isFresh = (f: { tool: string; rule: string; file: string }, fresh: Set<string>) =>
  f.tool === "code" && fresh.has(f.rule) && !NEW_STRUCTURE.test(f.file);

/** The folders already in the new structure: a new rule's findings are never recorded there. */
const NEW_STRUCTURE = /^src\/(routes|features|shared|services|testing)\//;

/** The code rules `rules` names that main's check (its source) doesn't define; none without main's. */
export function newRulesOf(mainCheck: string | undefined, rules: string[]): Set<string> {
  if (mainCheck === undefined) return new Set();
  const defined = new Set([...mainCheck.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]));
  return new Set(rules.filter((r) => !defined.has(r)));
}

/**
 * The list to write after a fix: today's counts, never above what was recorded, sorted. A new
 * rule's findings (`fresh`) are recorded once, each owned by the step for its folder.
 */
export function recordOf(
  now: Map<string, Known>,
  known: Known[],
  owners: [string, string][],
  fresh = new Set<string>(),
) {
  const silent = compare(now, known).errors.filter((e) => e.startsWith("silent:"));
  if (silent.length) return { refused: silent };
  const record = new Map(known.map((k) => [keyOf(k), k]));
  const over = [...now.values()].filter(
    (n) => record.size > 0 && !isFresh(n, fresh) && n.count > (record.get(keyOf(n))?.count ?? 0),
  );
  if (over.length) return { refused: over.map((n) => `${n.file}: ${n.tool} ${n.rule}`) };
  const list = [...now.values()]
    .map((n) => ({ ...n, owner: record.get(keyOf(n))?.owner ?? ownerOf(n.file, owners) }))
    .sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  return { list };
}

const npx = async (args: string[]) => {
  try {
    return (await run("npx", args, { maxBuffer: 64 * 1024 * 1024 })).stdout;
  } catch (e) {
    // The tools exit non-zero when they find something: then their output is what counts. No output
    // means the tool itself failed.
    const out = (e as { stdout?: string }).stdout;
    if (!out) throw new Error(`npx ${args.join(" ")} failed with no output: ${String(e)}`);
    return out;
  }
};

/** Every tool's findings; a tool whose output can't be read fails the run instead of counting as none. */
async function collect(): Promise<Finding[]> {
  const tsc = await npx(["tsc", "-p", "tsconfig.strict.json", "--noEmit", "--pretty", "false"]);
  const lint = await npx(["oxlint", "-f", "json"]);
  // jscpd writes its report to a file: an old one must never stand in for a run that failed.
  rmSync(JSCPD_REPORT, { force: true });
  await run("npx", ["jscpd"], { maxBuffer: 64 * 1024 * 1024 });
  const copies = readFileSync(JSCPD_REPORT, "utf8");
  const unused = await npx(["knip", "--no-progress", "--reporter", "json"]);
  const code = checkCode("src").map((f) => ({ tool: "code", rule: f.rule, file: `src/${f.file}` }));
  return [...fromTsc(tsc), ...fromOxlint(lint), ...fromJscpd(copies), ...fromKnip(unused), ...code];
}

/**
 * main's list with each file under its name today: git's renames (`git diff -M --name-status`
 * lines, paths from the repo's root) applied, so a moved file keeps its entries.
 */
export function renamed(main: Known[], nameStatus: string): Known[] {
  const to = new Map<string, string>();
  for (const line of nameStatus.split("\n")) {
    const [status, from, now] = line.split("\t");
    if (status?.startsWith("R") && from && now) to.set(from.replace(/^app\//, ""), now.replace(/^app\//, ""));
  }
  return main.map((k) => ({ ...k, file: to.get(k.file) ?? k.file }));
}

async function mainRecord(): Promise<Known[] | undefined> {
  try {
    await run("git", ["rev-parse", "--verify", "origin/main"]);
  } catch {
    if (process.env.CI) throw new Error("origin/main isn't fetched: the guard can't check that the list only shrinks");
    console.warn("origin/main isn't fetched here: skipping the check against main's list.");
    return undefined;
  }
  let text: string;
  try {
    text = (await run("git", ["show", `origin/main:app/${KNOWN}`])).stdout;
  } catch (e) {
    // Only "main has no list yet" (the change that adds it) is a reason to skip; anything else fails.
    if (/does not exist|exists on disk, but not in/.test(String((e as { stderr?: string }).stderr ?? e))) {
      console.warn("main has no list of known findings yet: this change adds it.");
      return undefined;
    }
    throw e;
  }
  const moves = (await run("git", ["diff", "-M", "--name-status", "origin/main", "--", "src"])).stdout;
  return renamed(JSON.parse(text) as Known[], moves);
}

/** main's code check, to tell which of today's rules are new; undefined when it can't be read. */
async function mainCodeCheck(): Promise<string | undefined> {
  try {
    // The rules are named in the code check and in the layout check it spreads in.
    const read = async (file: string) => (await run("git", ["show", `origin/main:app/scripts/${file}`])).stdout;
    return `${await read("check-code.ts")}\n${await read("check-layout.ts").catch(() => "")}`;
  } catch {
    return undefined;
  }
}

async function main(args: string[]) {
  const owners = JSON.parse(readFileSync(OWNERS, "utf8")) as [string, string][];
  const known = existsSync(KNOWN) ? (JSON.parse(readFileSync(KNOWN, "utf8")) as Known[]) : [];
  const now = countAll(await collect());
  const fresh = newRulesOf(await mainCodeCheck(), Object.keys(RULES));

  if (args.includes("--record")) {
    const result = recordOf(now, known, owners, fresh);
    if (result.refused) {
      console.error(
        `Not recorded: these are new, and the list only shrinks. Fix them first:\n  ${result.refused.join("\n  ")}`,
      );
      process.exit(1);
    }
    writeFileSync(KNOWN, JSON.stringify(result.list, null, 2) + "\n");
    console.log(`${KNOWN}: ${result.list.reduce((s, k) => s + k.count, 0)} findings recorded.`);
    return;
  }

  const { errors, known: still } = compare(now, known, await mainRecord(), fresh);
  const byOwner = new Map<string, number>();
  for (const k of still)
    byOwner.set(k.owner || ownerOf(k.file, owners), (byOwner.get(k.owner || ownerOf(k.file, owners)) ?? 0) + k.count);
  const total = still.reduce((s, k) => s + k.count, 0);
  console.warn(`Recorded, still to clear (warnings): ${total}, by owner:`);
  for (const [owner, n] of [...byOwner].sort((a, b) => b[1] - a[1])) console.warn(`  ${owner}: ${n}`);
  if (args.includes("--all")) for (const k of still) console.warn(`  ${k.file}: ${k.tool} ${k.rule} × ${k.count}`);
  for (const e of errors) console.error(e);
  console.log(errors.length ? `${errors.length} problems.` : "Guard: nothing new, and the list matches the code.");
  process.exit(errors.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main(process.argv.slice(2));
