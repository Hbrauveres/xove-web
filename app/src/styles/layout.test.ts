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

  it("has none of the old camera display's clutter, nor a frame inside the corners (spec 0136)", () => {
    expect(empty).not.toMatch(/\.(meter|tags|ruler|grid|fps)\b/);
    expect(rule(empty, ".focus")).not.toMatch(/background|border/);
  });

  it("shows the seats as little screens, a steady light only under a live one (spec 0136)", () => {
    const seats = sheet("components/stage/AlsoLive.module.css");
    const seat = rule(seats, ".free i");
    expect(seat).toMatch(/width:\s*16px/);
    expect(seat).toMatch(/height:\s*10px/);
    expect(seat).not.toMatch(/shadow|animation/);
    expect(rule(seats, ".free i[data-on]")).toMatch(/box-shadow:[^;]*rgba\(239, 75, 75/);
    expect(rule(seats, ".free i[data-on]")).not.toMatch(/animation/);
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

describe("clear of the phone's own bars (spec 0141)", () => {
  const global = sheet("styles/global.css");
  const room = sheet("pages/RoomPage.module.css");
  const stage = sheet("components/stage/Stage.module.css");
  const queue = sheet("components/room/WaitingRoom.module.css");
  const home = sheet("pages/HomePage.module.css");
  const request = sheet("pages/RequestAccessPage.module.css");
  const admin = sheet("pages/AdminPage.module.css");
  /** The rules inside the phone-sideways query, which comes last in the sheet. */
  const sideways = (css: string) => css.slice(css.indexOf("@media (orientation: landscape) and (max-height: 500px)"));

  it("reads the phone's bars from the browser, 0 where there are none", () => {
    for (const side of ["top", "right", "bottom", "left"]) {
      expect(global).toContain(`--safe-${side}: env(safe-area-inset-${side}, 0px);`);
    }
  });

  it("starts the room's header under the status bar, and ends its list above the home bar", () => {
    expect(rule(room, ".theater")).toMatch(/padding-top:\s*var\(--safe-top\)/);
    // Sideways and in the full view, the stage keeps its own controls clear: the room adds nothing.
    expect(rule(room, '.theater[data-layout="sideways"]')).toMatch(/padding-top:\s*0/);
    expect(rule(stage, ".below")).toMatch(/padding-bottom:\s*var\(--safe-bottom\)/);
  });

  it("pads the other pages' content on every side, never less than the gutter, while their backgrounds run to the edges", () => {
    for (const [css, selector] of [[queue, ".wrap"], [home, ".wrap"], [request, ".wrap"], [admin, ".shell"]] as const) {
      const body = rule(css, selector);
      for (const side of ["top", "right", "bottom", "left"]) expect(body, `${selector} ${side}`).toContain(`var(--safe-${side})`);
      expect(body).toContain("max(var(--gutter), var(--safe-left))");
    }
    expect(rule(home, ".wrap")).toMatch(/background:/);
  });

  it("shows LIVE in capitals and the accent, written as a word (design decision 7)", () => {
    for (const css of [home, sheet("components/stage/EmptyStage.module.css")]) {
      const em = rule(css, ".title em");
      expect(em).toMatch(/text-transform:\s*uppercase/);
      expect(em).toMatch(/color:\s*var\(--accent\)/);
    }
  });

  it("fits sign-in sideways: the mark and headline, then what to do, side by side", () => {
    const css = sideways(home);
    expect(rule(css, ".card")).toMatch(/flex-direction:\s*row/);
    expect(rule(css, ".lead,\n  .act")).toMatch(/display:\s*flex/);
    expect(rule(home, ".lead,\n.act")).toMatch(/display:\s*contents/);
  });

  it("fits request access sideways in two columns, and request sent in one", () => {
    const css = sideways(request);
    expect(rule(css, ".card")).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/);
    expect(rule(css, ".card:has(.waiting)")).toMatch(/display:\s*flex/);
  });
});

describe("the standby screen, balanced on every screen (spec 0138)", () => {
  const empty = sheet("components/stage/EmptyStage.module.css");
  const phone = ':global(:is([data-layout="phone"], [data-layout="sideways"]))';

  it("lays the ways to start out as one row: two pills of one width and the cog, centred as a whole", () => {
    const go = rule(empty, ".go");
    expect(go).toMatch(/display:\s*grid/);
    expect(go).toMatch(/grid-template-columns:\s*1fr 1fr var\(--h\)/);
    expect(go).toMatch(/justify-content:\s*center/);
    expect(empty).not.toMatch(/\.go::before/);
  });

  it("sizes every button from the row: 44 px on a desktop, the stage's own 34 px on a phone", () => {
    expect(rule(empty, ".go")).toMatch(/--h:\s*44px/);
    expect(rule(empty, `${phone} .go`)).toMatch(/--h:\s*34px/);
    expect(rule(empty, ".go button")).toMatch(/height:\s*var\(--h\)/);
    // The cog is round: no pill padding, whatever the size's rules say.
    const cog = rule(empty, ".go .cog.cog");
    expect(cog).toMatch(/width:\s*var\(--h\)/);
    expect(cog).toMatch(/padding:\s*0/);
  });

  it("keeps a short stage's way to start in its middle, not pushed up for the corner buttons", () => {
    const short = empty.slice(empty.indexOf("@container (max-height: 320px)"));
    expect(rule(short, ".empty")).toMatch(/padding:\s*12px 20px;/);
  });

  it("greys the screen it can't share in place, the same pill as the camera's", () => {
    const unavailable = rule(empty, ".unavailable");
    expect(unavailable).not.toMatch(/width|padding/);
    expect(unavailable).toMatch(/opacity:\s*0\.45/);
  });
});
