/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** A stylesheet from src/, read from disk (the test runner stubs CSS imports). */
const sheet = (path: string) => readFileSync(`${__dirname}/../${path}`, "utf8");
/** The first rule whose selector is exactly `selector`, its body only. */
const rule = (css: string, selector: string) => {
  const at = css.indexOf(`${selector} {`);
  expect(at, selector).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf("}", at));
};

describe("the room on a phone held upright (spec 0158)", () => {
  const room = sheet("pages/RoomPage.module.css");
  const stage = sheet("components/stage/Stage.module.css");

  it("stays one screen high: the page itself never scrolls", () => {
    expect(rule(room, ".theater")).toMatch(/height:\s*100dvh/);
    expect(rule(room, ".theater")).toMatch(/overflow:\s*hidden/);
    expect(rule(room, '.theater[data-layout="phone"] .middle')).toMatch(/padding:\s*0/);
  });

  it("runs the stage's box edge to edge, as tall as the picture needs, never taller than 60% of the screen (spec 0133)", () => {
    const box = rule(stage, '.stage[data-layout="phone"] .box');
    expect(box).toMatch(/width:\s*100cqw/);
    expect(box).toMatch(/height:\s*min\(100cqw \/ var\(--shape\), 60dvh\)/);
    expect(rule(stage, '.stage[data-layout="phone"] .picture')).toMatch(/border-radius:\s*0/);
  });

  it("keeps the stage and its info row in place: only the block under them scrolls", () => {
    expect(rule(stage, '.stage[data-layout="phone"] .box')).toMatch(/flex:\s*none/);
    expect(rule(stage, '.stage[data-layout="phone"] .info')).toMatch(/flex:\s*none/);
    const below = rule(stage, ".below");
    expect(below).toMatch(/flex:\s*1/);
    expect(below).toMatch(/overflow-y:\s*auto/);
  });
});

describe("the empty stage, a camera waiting (spec 0123, design decisions 6 and 7)", () => {
  const empty = sheet("components/stage/EmptyStage.module.css");

  it("is one flat dark, its corners close to the edge, the top right red", () => {
    expect(rule(empty, ".empty")).toMatch(/background:\s*#0f0f11/);
    expect(rule(empty, ".empty")).toMatch(/--inset:\s*6px/);
    expect(rule(empty, '.corner[data-at="tr"]')).toMatch(/border-color:\s*var\(--accent\)/);
  });

  it("keeps only the display's top line on a small stage", () => {
    expect(empty).toMatch(/@container \(max-width: 640px\) \{\s*\.meter,\s*\.tags,\s*\.ruler,/);
  });

  it("glows from blurred L's just outside the stage, the top right red", () => {
    const glow = sheet("components/stage/CornerGlow.module.css");
    expect(rule(glow, ".glow i")).toMatch(/filter:\s*blur\(var\(--blur\)\)/);
    expect(rule(glow, '.glow i[data-at="tr"]')).toMatch(/--c:\s*rgba\(239, 75, 75/);
  });
});

describe("the phone's feed (spec 0158)", () => {
  it("keeps each video inside its card: the picture box positions it", () => {
    // The video is absolutely positioned (ScreenVideo); without this it covered the whole page.
    expect(rule(sheet("components/stage/LiveFeed.module.css"), ".picture")).toMatch(/position:\s*relative/);
  });
});

describe("the room on a phone sideways, and tablets (spec 0160)", () => {
  const stage = sheet("components/stage/Stage.module.css");

  it("makes the stage's box the whole screen; the picture fills its height first, hugging its shape (spec 0133)", () => {
    const box = rule(stage, '.stage[data-layout="sideways"] .box');
    expect(box).toMatch(/width:\s*100cqw/);
    expect(box).toMatch(/height:\s*100dvh/);
  });

  it("fades the top bar and the row's tab with the controls", () => {
    expect(rule(stage, '.stage[data-layout="sideways"][data-chrome="hidden"] [data-fades]')).toMatch(/opacity:\s*0/);
  });

  it("centres what's under the stage in a 640 px column on a wider screen held upright", () => {
    const column = rule(stage, '.stage[data-layout="phone"] .info,\n.below > *');
    expect(column).toMatch(/max-width:\s*640px/);
    expect(column).toMatch(/margin-inline:\s*auto/);
  });
});

describe("no pull-to-refresh in the room", () => {
  it("turns it off only while the room is on the page, so a drag down (the volume) never reloads", () => {
    const global = sheet("styles/global.css");
    expect(rule(global, "html:has([data-room]),\nhtml:has([data-room]) body")).toMatch(/overscroll-behavior:\s*none/);
    expect(rule(global, "html,\nbody,\n#root")).not.toMatch(/overscroll-behavior/);
  });
});

describe("the fullscreen button in the full-screen view (specs 0171 and 0111)", () => {
  it("sits centred on the round buttons' row, at each of their sizes", () => {
    const stage = sheet("components/stage/Stage.module.css");
    // The place is the overlay's own rule, for every layout; a layout only gives its buttons' size.
    expect(stage).toMatch(/\.stage\[data-layout="phone"\] \[data-overlay\],\s*\.stage\[data-layout="phone"\] \.controls \{\s*--btn:\s*44px/);
    // The round buttons have no narrow-screen size of their own, so the fullscreen button has none either.
    expect(stage).not.toMatch(/--btn:\s*42px/);
  });
});

describe("the stage on a tall desktop window", () => {
  it("may be as tall as the free height above the info row, never less than the 16:9 box; its box the column's width (spec 0133)", () => {
    const box = rule(sheet("components/stage/Stage.module.css"), ".box");
    expect(box).toMatch(/--free-h:\s*max\(100cqw \* 9 \/ 16, 100cqh - var\(--info-h, 104px\) - var\(--info-gap, 14px\)\)/);
    expect(box).toMatch(/width:\s*100cqw/);
    expect(box).toMatch(/height:\s*min\(100cqw \/ var\(--shape\), var\(--free-h\)\)/);
  });
});

describe("the stage's two layers (spec 0133, ADR-0072)", () => {
  const stage = sheet("components/stage/Stage.module.css");

  it("makes the box the controls' layer: see-through, its own size the buttons' measure", () => {
    const frame = rule(stage, ".frame");
    expect(frame).toMatch(/container-type:\s*size/);
    expect(frame).not.toMatch(/background|overflow:\s*hidden|border-radius/);
  });

  it("holds the picture in a view of its own shape, as big as the box allows, centred", () => {
    const view = rule(stage, ".view");
    expect(view).toMatch(/width:\s*min\(100cqw, 100cqh \* var\(--shape\)\)/);
    expect(view).toMatch(/height:\s*min\(100cqh, 100cqw \/ var\(--shape\)\)/);
    expect(view).toMatch(/translate:\s*-50% -50%/);
    const picture = rule(stage, ".picture");
    expect(picture).toMatch(/overflow:\s*hidden/);
    expect(picture).toMatch(/border-radius:\s*12px/);
    expect(picture).toMatch(/background:\s*#000/);
  });

  it("lifts the controls over the sideways streams row from the row's own sizes, written once", () => {
    const row = sheet("components/stage/StreamsRow.module.css");
    const shared = rule(stage, ".stage");
    expect(shared).toMatch(/--row-content:\s*calc\(var\(--row-head\) \+ var\(--row-head-gap\) \+ var\(--row-pictures\) \* 9 \/ 16 \+ var\(--row-bottom\)/);
    // The row draws itself from the same values the controls are lifted by, and its arrow too.
    for (const name of ["--row-head", "--row-head-gap", "--row-pictures", "--row-bottom", "--row-arrow-inset", "--row-arrow"]) {
      expect(shared, name).toMatch(new RegExp(`${name}:`));
      expect(row, name).toMatch(new RegExp(`var\\(${name},`));
    }
    expect(rule(stage, ".stage[data-row-arrow] [data-viewer-bar]")).toMatch(/var\(--row-arrow-inset\) \+ var\(--row-arrow\)/);
  });
});
