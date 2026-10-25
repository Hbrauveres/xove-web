// Runs every test file alone, then every single test alone, to prove that none leans on another
// (docs/testing.md). Slow (one Vitest start per test), so it's run by hand, not in the commit checks.
// Run from app/: npm run test:alone [-- <file filter>]. Prints what fails alone; exits 1 if anything does.
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/** `it.each`'s placeholders, which `vitest list` prints as written ("%s: has its hint", "$name"). */
const PLACEHOLDER = /%[sdifjo#%]|\$\w+/g;

/**
 * Vitest's `-t` pattern for one test as `vitest list` names it (describe > test, its quotes escaped):
 * that test only, or every case of an `it.each`, which then run together (`cases`).
 */
export function patternFor(listedName: string) {
  const name = listedName.replace(/\\"/g, '"');
  const parts = name.split(PLACEHOLDER).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return { pattern: `^${parts.join(".+?")}$`, cases: parts.length > 1 };
}

/** A run proves something only if what it targeted ran and passed: a pattern that matched nothing
 * skips everything, and Vitest calls that a pass. One test, or at least one case of an `it.each`. */
export function ranAsTargeted(output: string, cases: boolean) {
  const summary = output.split(/\n\s*Tests\s+/)[1]?.split("\n")[0] ?? "";
  const passed = Number(/(\d+) passed/.exec(summary)?.[1] ?? 0);
  return !/failed/.test(summary) && (cases ? passed >= 1 : passed === 1);
}

/** Runs `jobs` at most `limit` at a time; returns the labels of those that failed. */
export async function inParallel(jobs: { label: string; go: () => Promise<unknown> }[], limit: number) {
  const failed: string[] = [];
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      await job.go().catch(() => failed.push(job.label));
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return failed;
}

const vitest = (...args: string[]) => run("npx", ["vitest", "run", ...args], { maxBuffer: 64 * 1024 * 1024 });

async function main(filter?: string) {
  const out = join(mkdtempSync(join(tmpdir(), "test-alone-")), "list.json");
  await run("npx", ["vitest", "list", `--json=${out}`, ...(filter ? [filter] : [])], { maxBuffer: 64 * 1024 * 1024 });
  const tests = (JSON.parse(readFileSync(out, "utf8")) as { name: string; file: string }[]).map((t) => ({ ...t, file: relative(process.cwd(), t.file) }));
  if (tests.length === 0) {
    console.error(`No tests found${filter ? ` for "${filter}"` : ""}: nothing was proven.`);
    process.exit(1);
  }
  const files = [...new Set(tests.map((t) => t.file))];
  const limit = Math.max(1, Math.floor(availableParallelism() / 2));

  console.log(`${files.length} files alone, ${limit} at a time…`);
  const filesFailed = await inParallel(files.map((f) => ({ label: f, go: () => vitest(f) })), limit);
  console.log(`${tests.length} tests alone, ${limit} at a time…`);
  const testsFailed = await inParallel(
    tests.map((t) => ({
      label: `${t.file} > ${t.name}`,
      go: async () => {
        const { pattern, cases } = patternFor(t.name);
        const { stdout } = await vitest(t.file, "-t", pattern);
        if (!ranAsTargeted(stdout, cases)) throw new Error("not what was targeted ran");
      },
    })),
    limit,
  );

  for (const f of filesFailed) console.error(`FAIL alone (file): ${f}`);
  for (const t of testsFailed) console.error(`FAIL alone (test): ${t}`);
  console.log(`${files.length - filesFailed.length} of ${files.length} files and ${tests.length - testsFailed.length} of ${tests.length} tests pass alone.`);
  process.exit(filesFailed.length || testsFailed.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main(process.argv[2]);
