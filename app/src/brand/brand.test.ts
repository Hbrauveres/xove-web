import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import favicon from "../../public/favicon.svg?raw";
import { iconSvg } from "./iconSvg";

/** Everything in public/, by name. */
const shipped = Object.keys(import.meta.glob("../../public/*")).map((p) => p.split("/").pop());
/** The page's <link> tags, as rel → href. */
const links = new Map(
  [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => [
    /rel="([^"]+)"/.exec(tag)?.[1],
    /href="([^"]+)"/.exec(tag)?.[1],
  ]),
);
const href = (rel: string) => links.get(rel);
/** The page's <meta name> tags, as name → content. */
const metas = new Map(
  [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => [
    /name="([^"]+)"/.exec(tag)?.[1],
    /content="([^"]+)"/.exec(tag)?.[1],
  ]),
);
const meta = (name: string) => metas.get(name);

describe("Xovê's icon in the browser, and no home-screen app (specs 0111 and 0223)", () => {
  it("links the favicon and nothing to install: no manifest, no home-screen icon or app tags", () => {
    expect(href("icon")).toBe("/favicon.svg");
    expect(html).toMatch(/<meta name="theme-color" content="#0c0c0d"/);
    expect(href("manifest")).toBeUndefined();
    expect(href("apple-touch-icon")).toBeUndefined();
    for (const name of ["mobile-web-app-capable", "apple-mobile-web-app-capable", "apple-mobile-web-app-status-bar-style"]) {
      expect(meta(name), name).toBeUndefined();
    }
  });

  it("ships only the favicon", () => {
    expect(shipped).toEqual(["favicon.svg"]);
  });

  it("keeps the favicon in step with the mark's geometry", () => {
    expect(favicon).toBe(iconSvg());
  });

  it("makes the favicon only the symbol, at its 16 px weight, edge to edge (spec 0113)", () => {
    expect(favicon).not.toMatch(/<rect/);
    expect(favicon).toMatch(/stroke-width="16"/);
    // Square, and the symbol's full height (146, strokes included) fills it.
    const [, , w, h] = /viewBox="([^"]+)"/.exec(favicon)![1].split(" ").map(Number);
    expect(w).toBe(h);
    expect(h).toBe(146);
  });

  it("follows the browser's mode: white strokes on dark, soft black on light, the red fixed (specs 0113 and 0121)", () => {
    expect(favicon).toMatch(/\.ink\s*\{\s*stroke:\s*#ebebec/);
    expect(favicon).toMatch(/@media \(prefers-color-scheme: light\)\s*\{\s*\.ink\s*\{\s*stroke:\s*#0c0c0d/);
    expect(favicon).toMatch(/stroke="#ef4b4b"/);
    expect(favicon).toMatch(/fill="#ef4b4b"/);
  });
});
