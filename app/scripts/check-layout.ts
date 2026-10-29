// The layout rules of ADR-0086 that need the whole app at once: who imports what, where units
// and parts sit, how deep a path goes. The code check (check-code.ts) runs it over src/.
import { dirname, join, normalize } from "node:path";

export const LAYOUT_RULES = {
  partOwner: "a part used outside the folder it lives in: it moves up, to the level its users share",
  partTooHigh: "a part used by a single unit (or feature) below it: it moves down, into that unit",
  unitInUnit: "a unit inside another unit: units sit side by side",
  nested: "a folder inside a part folder, or inside a component's folder: nothing nests",
  tooDeep: "a path more than 6 levels under src/",
  importUp: "an import going up: routes → features → shared → services, never back",
  importAcross: "a feature importing another feature: what two features use goes to shared/",
  indexBypass: "an import reaching inside a unit: go through its index.ts",
  importTesting: "the app importing testing/: only tests may",
} as const;

export type LayoutRule = keyof typeof LAYOUT_RULES;
export type LayoutFinding = { rule: LayoutRule; file: string; line: number; text: string };

const KINDS = new Set(["hooks", "utils", "constants", "types", "enums"]);
const RANK: Record<string, number> = { routes: 0, features: 1, shared: 2, services: 3 };
const ALIASES = ["routes", "features", "shared", "services", "testing"];
const MAX_DEPTH = 6;
const UNIT_FILE = /\.(component|page|store|service|adapter)\.tsx?$/;
const IMPORT = /^\s*(?:import|export)\b[^"']*["']([^"']+)["']/;
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

const isTest = (f: string) => /\.test\.tsx?$/.test(f);
const top = (f: string) => f.split("/")[0] ?? "";
const isNew = (f: string) => top(f) in RANK;
const isOld = (f: string) => f.includes("/") && !isNew(f) && top(f) !== "testing";
const inside = (f: string, dir: string) => f.startsWith(`${dir}/`);
const featureOf = (f: string) => (top(f) === "features" ? f.split("/").slice(0, 2).join("/") : null);

/** The file an import points at, or null outside the app. */
function resolveImport(spec: string, from: string, files: Map<string, string>): string | null {
  const alias = ALIASES.find((a) => spec.startsWith(`@${a}/`));
  const base = alias
    ? `${alias}/${spec.slice(alias.length + 2)}`
    : spec.startsWith(".")
      ? normalize(join(dirname(from), spec))
      : null;
  if (base === null) return null;
  return EXTENSIONS.map((e) => base + e).find((p) => files.has(p)) ?? null;
}

/** The folders that are units: an index.ts beside a component, page, store, service or adapter. */
function unitsOf(files: Map<string, string>): Set<string> {
  const dirs = new Set([...files.keys()].filter((f) => f.endsWith("/index.ts")).map(dirname));
  return new Set(
    [...dirs].filter((d) => [...files.keys()].some((f) => dirname(f) === d && UNIT_FILE.test(f) && !isTest(f))),
  );
}

/** The deepest unit holding a file, or null. */
const unitOf = (f: string, units: Set<string>) =>
  [...units].filter((u) => inside(f, u)).sort((a, b) => b.length - a.length)[0] ?? null;

/** Who imports each file, with the line: only the app's own code, never tests. */
function importersOf(files: Map<string, string>) {
  const by = new Map<string, { file: string; line: number; text: string }[]>();
  for (const [file, text] of files) {
    if (isTest(file)) continue;
    text.split("\n").forEach((l, i) => {
      const spec = IMPORT.exec(l)?.[1];
      const target = spec ? resolveImport(spec, file, files) : null;
      if (target && target !== file) by.set(target, [...(by.get(target) ?? []), { file, line: i + 1, text: l.trim() }]);
    });
  }
  return by;
}

/** Where a part's users sit, seen from its owner: the unit or feature each one is in, or null when one is at the owner's level. */
function placeOf(user: string, owner: string, units: Set<string>): string | null {
  if (inside(user, owner)) {
    const unit = unitOf(user, units);
    return unit && unit !== owner && inside(unit, owner) ? unit : null;
  }
  return owner === "shared" ? (featureOf(user) ?? unitOf(user, units)) : null;
}

function partFindings(files: Map<string, string>, units: Set<string>, importers: ReturnType<typeof importersOf>) {
  const out: LayoutFinding[] = [];
  for (const file of files.keys()) {
    const parts = file.split("/");
    if (!isNew(file) || isTest(file) || !KINDS.has(parts.at(-2) ?? "")) continue;
    const owner = parts.slice(0, -2).join("/");
    if (units.has(owner)) continue;
    const users = (importers.get(file) ?? [])
      .map((u) => u.file)
      .filter((u) => top(u) !== "testing" && !u.endsWith("/index.ts"));
    if (users.some((u) => !inside(u, owner) && !isOld(u) && owner !== "shared"))
      out.push({ rule: "partOwner", file, line: 0, text: owner });
    const places = new Set(users.map((u) => (isOld(u) ? "old" : placeOf(u, owner, units))));
    const [only] = places;
    if (users.length && places.size === 1 && only && only !== "old")
      out.push({ rule: "partTooHigh", file, line: 0, text: only });
  }
  return out;
}

function shapeFindings(files: Map<string, string>, units: Set<string>) {
  const out: LayoutFinding[] = [];
  for (const file of files.keys()) {
    if (!isNew(file)) continue;
    const parts = file.split("/");
    const dirs = parts.slice(0, -1);
    const unit = unitOf(file, units);
    if (
      unit &&
      dirname(file) === unit &&
      UNIT_FILE.test(file) &&
      !isTest(file) &&
      [...units].some((u) => u !== unit && inside(unit, u))
    )
      out.push({ rule: "unitInUnit", file, line: 0, text: unit });
    const kindAt = dirs.findIndex((d) => KINDS.has(d));
    const components = dirs.indexOf("components");
    const rest = components >= 0 ? dirs.slice(components + 2) : [];
    if ((kindAt >= 0 && kindAt < dirs.length - 1) || (rest.length > 0 && !KINDS.has(rest[0] ?? "")))
      out.push({ rule: "nested", file, line: 0, text: "" });
    if (parts.length > MAX_DEPTH) out.push({ rule: "tooDeep", file, line: 0, text: `${parts.length} levels` });
  }
  return out;
}

function importFindings(units: Set<string>, importers: ReturnType<typeof importersOf>) {
  const out: LayoutFinding[] = [];
  for (const [target, users] of importers)
    for (const u of users) {
      if (!isNew(u.file)) continue;
      const at = { file: u.file, line: u.line, text: u.text };
      const from = RANK[top(u.file)] ?? 0;
      if (top(target) === "testing") out.push({ rule: "importTesting", ...at });
      else if (isNew(target) && (RANK[top(target)] ?? 0) < from) out.push({ rule: "importUp", ...at });
      else if (featureOf(target) && featureOf(u.file) && featureOf(target) !== featureOf(u.file))
        out.push({ rule: "importAcross", ...at });
      const unit = unitOf(target, units);
      if (unit && !inside(u.file, unit) && target !== `${unit}/index.ts`) out.push({ rule: "indexBypass", ...at });
    }
  return out;
}

const ORDER = Object.keys(LAYOUT_RULES);

/** Every layout finding over the app's files (paths relative to src, with their text), by file. */
export function checkLayout(files: Map<string, string>): LayoutFinding[] {
  const units = unitsOf(files);
  const importers = importersOf(files);
  return [
    ...partFindings(files, units, importers),
    ...shapeFindings(files, units),
    ...importFindings(units, importers),
  ].sort((a, b) => a.file.localeCompare(b.file) || ORDER.indexOf(a.rule) - ORDER.indexOf(b.rule) || a.line - b.line);
}
