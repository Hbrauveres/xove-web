// Runs every test file alone, then every single test alone, to prove that none leans on another
// (docs/testing.md). Slow (one Vitest start per test), so it's run by hand, not in the commit checks.
// Run from app/: npm run test:alone [-- <file filter>]. Prints what fails alone; exits 1 if anything does.
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Vitest's `-t` matches a test's full name as `vitest list` prints it (describe > test): this one only. */
export function patternFor(listedName: string) {
  return `^${listedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
}

/** A run of one test proves something only if that one test ran and passed: a pattern that matched
 * nothing skips everything, and Vitest calls that a pass. */
export function ranExactlyOne(output: string) {
  return /Tests\s+1 passed\b/.test(output) && !/\bfailed\b/.test(output.split("Tests")[1] ?? "");
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
  const files = [...new Set(tests.map((t) => t.file))];
  const limit = Math.max(1, Math.floor(availableParallelism() / 2));

  console.log(`${files.length} files alone, ${limit} at a time…`);
  const filesFailed = await inParallel(files.map((f) => ({ label: f, go: () => vitest(f) })), limit);
  console.log(`${tests.length} tests alone, ${limit} at a time…`);
  const testsFailed = await inParallel(
    tests.map((t) => ({
      label: `${t.file} > ${t.name}`,
      go: async () => {
        const { stdout } = await vitest(t.file, "-t", patternFor(t.name));
        if (!ranExactlyOne(stdout)) throw new Error("not exactly one test ran");
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
