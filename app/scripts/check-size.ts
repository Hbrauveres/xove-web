// The app's size budget: the built JavaScript and styles, compressed, against checks/size-budget.json
// (docs/architecture.md, "The checks"). Run from app/ after npm run build: npm run check:size.
// Fails over the budget, and also well under it, so that a lighter app lowers its budget too.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/** Room above today's size the budget allows, and how far under it a size may fall before the
 * budget must come down with it. */
export const MARGIN = 0.1;
/** kB as Vite prints them in the build log: 1,000 bytes. */
const kB = 1000;

export type Sizes = { js: number; css: number };

/** The compressed size, in kB, of every file of one kind in the build. */
export function measure(dist: string): Sizes {
  const files = readdirSync(join(dist, "assets"));
  const kb = (ext: string) =>
    files
      .filter((f) => f.endsWith(ext))
      .reduce((s, f) => s + gzipSync(readFileSync(join(dist, "assets", f))).length, 0) / kB;
  return { js: kb(".js"), css: kb(".css") };
}

/** What's wrong with today's sizes against the budget: over it, or so far under that it should drop. */
export function problems(sizes: Sizes, budget: Sizes) {
  return (["js", "css"] as const).flatMap((kind) => {
    const size = sizes[kind];
    const limit = budget[kind];
    if (size > limit) return [`${kind}: ${size.toFixed(1)} kB, over its ${limit} kB budget`];
    if (size * (1 + MARGIN) < limit - 1)
      return [
        `${kind}: ${size.toFixed(1)} kB, well under its ${limit} kB budget: lower it to ${Math.ceil(Number((size * (1 + MARGIN)).toFixed(6)))} kB`,
      ];
    return [];
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const budget = JSON.parse(readFileSync("checks/size-budget.json", "utf8")) as Sizes;
  const sizes = measure("dist");
  const found = problems(sizes, budget);
  for (const p of found) console.error(p);
  console.log(
    `JavaScript ${sizes.js.toFixed(1)} of ${budget.js} kB, styles ${sizes.css.toFixed(1)} of ${budget.css} kB (compressed).`,
  );
  process.exit(found.length ? 1 : 0);
}
