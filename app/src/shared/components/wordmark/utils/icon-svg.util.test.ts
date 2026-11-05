import { describe, expect, it } from "vitest";
import favicon from "../../../../../public/favicon.svg?raw";
import { iconSvg } from "./icon-svg.util";

describe("the favicon", () => {
  it("keeps the favicon in step with the mark's geometry", () => {
    expect(favicon).toBe(iconSvg());
  });

  it("makes the favicon only the symbol, at its 16 px weight, edge to edge", () => {
    expect(favicon).not.toMatch(/<rect/);
    expect(favicon).toMatch(/stroke-width="16"/);
    // Square, and the symbol's full height (146, strokes included) fills it.
    const [, , w, h] = (/viewBox="([^"]+)"/.exec(favicon)?.[1] ?? "").split(" ").map(Number);
    expect(w).toBe(h);
    expect(h).toBe(146);
  });

  it("follows the browser's mode: white strokes on dark, soft black on light, the red fixed", () => {
    expect(favicon).toMatch(/\.ink\s*\{\s*stroke:\s*#ebebec/);
    expect(favicon).toMatch(/@media \(prefers-color-scheme: light\)\s*\{\s*\.ink\s*\{\s*stroke:\s*#0c0c0d/);
    expect(favicon).toMatch(/stroke="#ef4b4b"/);
    expect(favicon).toMatch(/fill="#ef4b4b"/);
  });
});
