// The speaking cue against the sound: on every frame, whether a cue is lit and whether
// its voice is sounding as the page plays it. What a viewer sees must follow what they hear.
import type { Locator, Page } from "@playwright/test";

/** One frame: when (performance.now()), whether the cue is lit, whether the voice sounds. */
export type CueFrame = { at: number; on: boolean; sound: boolean };

/** How soon the cue lights after the sound starts, and when it may go out after it stops (ms). */
const CUE_LIGHTS_WITHIN_MS = 100;
const CUE_OFF_AFTER_MS = { min: 150, max: 350 } as const;

/**
 * Reads, on every frame until the returned stop is called, whether `target` matches `lit` and
 * whether `who`'s voice sounds (the harness's room panel's voices).
 */
export async function recordCue(
  page: Page,
  target: Locator,
  lit: string,
  who: string,
): Promise<() => Promise<CueFrame[]>> {
  const handle = await target.elementHandle();
  await page.evaluate(
    ({ el, lit, who }) => {
      const w = window as unknown as {
        cueFrames: CueFrame[];
        cueOn: boolean;
        __xoveSounding: (who: string) => boolean;
      };
      w.cueFrames = [];
      w.cueOn = true;
      const read = () => {
        w.cueFrames.push({ at: performance.now(), on: Boolean(el?.matches(lit)), sound: w.__xoveSounding(who) });
        if (w.cueOn) requestAnimationFrame(read);
      };
      requestAnimationFrame(read);
    },
    { el: handle, lit, who },
  );
  return () =>
    page.evaluate(() => {
      const w = window as unknown as { cueFrames: CueFrame[]; cueOn: boolean };
      w.cueOn = false;
      return w.cueFrames;
    });
}

/**
 * What's wrong with a cue against its voice's sound, as sentences; empty when it follows it: lit
 * within `CUE_LIGHTS_WITHIN_MS` of every start, never out longer than a hold while the sound plays
 * (a busy machine's audio may drop out for a moment, and then the page hears nothing), out between
 * `CUE_OFF_AFTER_MS` after every silence long enough (a shorter one may keep it lit, between words).
 * Only the changes far enough inside the recording count.
 */
export function cueAgainstSound(frames: CueFrame[]): string[] {
  const last = frames.at(-1)?.at ?? 0;
  const changes = frames
    .filter((f, i) => i > 0 && f.sound !== frames[i - 1]?.sound && f.at < last - CUE_OFF_AFTER_MS.max)
    .map((f) => ({ at: f.at, on: f.sound }));
  const problems: string[] = [];
  changes.forEach((c, i) => {
    const next = changes[i + 1]?.at ?? last;
    if (c.on) {
      const lit = frames.find((f) => f.at >= c.at && f.on);
      if (!lit || lit.at - c.at > CUE_LIGHTS_WITHIN_MS)
        problems.push(`sound at ${Math.round(c.at)}: lit ${lit ? Math.round(lit.at - c.at) : "never"} ms after`);
      // Out while it plays, for longer than a hold: a missed voice, not a dropout of the page's audio.
      const playing = frames.filter((f) => f.at > c.at + CUE_LIGHTS_WITHIN_MS && f.at < next);
      const gap = playing.find(
        (f, i) => !f.on && (playing.slice(i).find((g) => g.on)?.at ?? next) - f.at > CUE_OFF_AFTER_MS.max,
      );
      if (gap) problems.push(`sound at ${Math.round(c.at)}: out at ${Math.round(gap.at)} while it played`);
    } else {
      // Out within the hold's window; a silence shorter than the window may keep it lit (between words).
      const out = frames.find((f) => f.at >= c.at && f.at < next && !f.on);
      const after = out ? out.at - c.at : Infinity;
      const short = next - c.at < CUE_OFF_AFTER_MS.max;
      if (after < CUE_OFF_AFTER_MS.min || (!short && after > CUE_OFF_AFTER_MS.max))
        problems.push(`silence at ${Math.round(c.at)}: out ${out ? Math.round(after) : "never"} ms after`);
    }
  });
  return problems;
}

/** One frame of `recordCueLooks`: when, and each target's cue layer shadow. */
export type CueLook = { at: number; looks: Record<string, string> };

/**
 * Reads, on every frame until the returned stop is called, the shadow each target's cue layer
 * (its `layer`: a round button's `::before`, a preview picture's `::after`) draws: "none" while
 * its cue is off, the tube and glow while it's lit.
 */
export async function recordCueLooks(
  page: Page,
  targets: Record<string, Locator>,
  layer = "::before",
): Promise<() => Promise<CueLook[]>> {
  const els: Record<string, unknown> = {};
  for (const [name, target] of Object.entries(targets)) els[name] = await target.elementHandle();
  await page.evaluate(
    ({ els, layer }) => {
      const w = window as unknown as { cueLooks: CueLook[]; cueLooksOn: boolean };
      w.cueLooks = [];
      w.cueLooksOn = true;
      const read = () => {
        const looks: Record<string, string> = {};
        for (const [name, el] of Object.entries(els)) looks[name] = getComputedStyle(el as Element, layer).boxShadow;
        w.cueLooks.push({ at: performance.now(), looks });
        if (w.cueLooksOn) requestAnimationFrame(read);
      };
      requestAnimationFrame(read);
    },
    { els, layer },
  );
  return () =>
    page.evaluate(() => {
      const w = window as unknown as { cueLooks: CueLook[]; cueLooksOn: boolean };
      w.cueLooksOn = false;
      return w.cueLooks;
    });
}
