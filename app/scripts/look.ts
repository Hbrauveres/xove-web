// The "looks the same" check (docs/testing.md): every screen of the harness, at one desktop size, recorded as
// each element's computed style and box, the same on every run; then two recordings compared.
// Run from app/, with the harness served (npm run harness, or the built one):
//   node scripts/look.ts record <width>x<height> <out.json> [<harness url>]
//   node scripts/look.ts compare <main.json> <branch.json> [<main's commit>] [--look-change] [--summary <file>]
// compare exits 1 on any difference, unless --look-change; it writes the report to --summary too.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { asRecorded, compare, report, type Recording, type Styles } from "./look-compare.ts";

/** Each screen: its query, and the buttons to click (by accessible name) to reach it. */
const SCREENS: [string, string, RegExp[]][] = [
  ["live", "s=live", []],
  ["portrait", "s=portrait", []],
  ["facecam", "s=facecam", []],
  ["empty", "s=empty", []],
  ["sound", "s=live&sound=1", []],
  ["activity", "s=live", [/^Activity/]],
  ["people", "s=live", [/people here$/]],
  ["account", "s=live", [/: account/]],
  ["go-live", "s=live", [/^Go live$/]],
  ["fullscreen", "s=live", [/^Fullscreen$/]],
  ["home", "page=home", []],
  ["home-error", "page=home&error=denied", []],
  ["request", "page=request", []],
  ["pending", "page=pending", []],
  ["admin", "page=admin", []],
  ["waiting", "page=waiting", []],
];
/** One moment for every run: the clock starts here and moves only when the recording moves it. */
const NOW = new Date("2026-10-24T20:40:00Z");
const SETTLE_MS = 1500;
const AFTER_CLICK_MS = 500;
const POINTER_MS = 400;
/** Placed this far left, an element is off screen: measured, never seen (the preview tray's labels). */
const OFF_SCREEN = -1000;

/** Every element's computed style and box on the page, by its path. */
function readPage(offScreen: number) {
  const pathOf = (el: Element) => {
    const parts: string[] = [];
    for (let e: Element | null = el; e && e !== document.documentElement; e = e.parentElement) {
      const same = e.parentElement ? [...e.parentElement.children].filter((c) => c.tagName === e?.tagName) : [e];
      parts.unshift(`${e.tagName.toLowerCase()}${same.length > 1 ? `[${same.indexOf(e)}]` : ""}`);
    }
    return parts.join(">");
  };
  const out: Record<string, Record<string, string>> = {};
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.x < offScreen) continue;
    const s = getComputedStyle(el);
    const style: Record<string, string> = {};
    for (const p of s) if (!p.startsWith("--")) style[p] = s.getPropertyValue(p);
    for (const pseudo of ["::before", "::after"]) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content && ps.content !== "none")
        for (const p of ps) if (!p.startsWith("--")) style[pseudo + p] = ps.getPropertyValue(p);
    }
    style["@box"] = [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100).join(",");
    out[pathOf(el)] = style;
  }
  return out;
}

async function screenOf(page: Page, url: string, clicks: RegExp[], [width, height]: number[]) {
  // Paused CSS animations and a fixed clock (time, timers and animation frames): the same picture each run.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
  await page.clock.install({ time: NOW });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(SETTLE_MS);
  await page.mouse.move((width ?? 0) / 2, (height ?? 0) / 2);
  await page.clock.runFor(POINTER_MS);
  for (const name of clicks) {
    await page.getByRole("button", { name }).first().click();
    await page.clock.runFor(AFTER_CLICK_MS);
  }
  const elements = await page.evaluate(readPage, OFF_SCREEN);
  return Object.fromEntries(Object.entries(elements).map(([path, styles]) => [path, asRecorded(styles as Styles)]));
}

export async function record(size: string, base = "http://localhost:5199") {
  const [width = 0, height = 0] = size.split("x").map(Number);
  const browser = await chromium.launch();
  const recording: Recording = {};
  for (const [name, query, clicks] of SCREENS) {
    const context = await browser.newContext({ viewport: { width, height } });
    recording[`${size} ${name}`] = await screenOf(await context.newPage(), `${base}/?${query}&panel=0`, clicks, [
      width,
      height,
    ]);
    await context.close();
  }
  await browser.close();
  return recording;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "record") {
    const [size = "1920x1080", out = "look.json", base] = args;
    writeFileSync(out, JSON.stringify(await record(size, base)));
    console.log(`${out}: ${size}, ${SCREENS.length} screens`);
  } else if (command === "compare") {
    const [mainFile = "", branchFile = "", against = "main"] = args.filter((a) => !a.startsWith("--"));
    const lookChange = args.includes("--look-change");
    const summary = args[args.indexOf("--summary") + 1];
    const read = (f: string) => JSON.parse(readFileSync(f, "utf8")) as Recording;
    const differences = compare(read(mainFile), read(branchFile));
    const text = report(differences, against, lookChange);
    if (args.includes("--summary") && summary) appendFileSync(summary, text);
    console.log(text);
    process.exitCode = differences.length && !lookChange ? 1 : 0;
  } else {
    console.error(
      "node scripts/look.ts record <width>x<height> <out.json> [url] | compare <main.json> <branch.json> [commit]",
    );
    process.exitCode = 2;
  }
}
