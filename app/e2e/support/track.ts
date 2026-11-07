// Records named elements on every animation frame, from inside the page, while something happens:
// whether each is there, shown, how opaque, and where. What blinks or moves shows in the frames.
import type { Locator, Page } from "@playwright/test";
import type { Frame } from "./frames.ts";

type Targets = Record<string, Locator>;

/** Starts recording; the returned function stops it and hands back the frames. */
export async function startTracking(page: Page, targets: Targets): Promise<() => Promise<Frame[]>> {
  const names = Object.keys(targets);
  const handles = await Promise.all(
    names.map((n) =>
      targets[n]!.first()
        .elementHandle({ timeout: 1000 })
        .catch(() => null),
    ),
  );
  await page.evaluate(
    ({ names, els }) => {
      const look = (el: Element | null) => {
        if (!el || !el.isConnected) return { present: false, visible: false, opacity: 0, box: null, transitions: {} };
        let opacity = 1;
        for (let e: Element | null = el; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
        const r = el.getBoundingClientRect();
        return {
          present: true,
          visible: el.checkVisibility({ visibilityProperty: true }) && r.width > 0 && r.height > 0,
          opacity,
          box: { x: r.x, y: r.y, w: r.width, h: r.height },
          // The transitions running on it, by property, with their length: a fade shows here even
          // when a screenshot holds the page past its in-between frames.
          transitions: Object.fromEntries(
            el
              .getAnimations()
              .flatMap((a) =>
                "transitionProperty" in a
                  ? [[String(a.transitionProperty), Number(a.effect?.getTiming().duration ?? 0)]]
                  : [],
              ),
          ),
        };
      };
      const record = { frames: [] as unknown[], on: true };
      (window as unknown as { __track: typeof record }).__track = record;
      const loop = (t: number) => {
        if (!record.on) return;
        record.frames.push({ t, seen: Object.fromEntries(names.map((n, i) => [n, look(els[i] ?? null)])) });
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    { names, els: handles },
  );
  return () =>
    page.evaluate(() => {
      const record = (window as unknown as { __track: { frames: Frame[]; on: boolean } }).__track;
      record.on = false;
      return record.frames;
    });
}
