// The "looks the same" check's comparison: two recordings of every screen's computed styles, element by
// element (scripts/look.ts records them). Plain functions, so they're tested without a browser.

/** One element's computed style, by property, and its box ("@box": x,y,width,height). */
export type Styles = Record<string, string>;
/** Every element of every screen: "<size> <screen>" → element path → its styles. */
export type Recording = Record<string, Record<string, Styles>>;
export type Difference = { screen: string; element: string; property: string; before: string; after: string };

/** A CSS module's keyframes carry a hash of their file's text (`_fade_x1y2z_1`): a file can change and draw
 * the same, so the hash isn't part of the look. */
export const unhashed = (value: string) => value.replace(/_([\w-]+?)_[a-z0-9]{5}_\d+/g, "$1");

/** What an element looks like, written so that only a change to the look changes it. */
export const asRecorded = (styles: Styles): Styles =>
  Object.fromEntries(Object.entries(styles).map(([property, value]) => [property, unhashed(value)]));

/** Every difference between `main`'s recording and the branch's: an element gone or new, or a property changed. */
export function compare(main: Recording, branch: Recording): Difference[] {
  const differences: Difference[] = [];
  for (const screen of new Set([...Object.keys(main), ...Object.keys(branch)])) {
    const [before, after] = [main[screen] ?? {}, branch[screen] ?? {}];
    for (const element of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const [a, b] = [before[element], after[element]];
      if (!a || !b) {
        differences.push({
          screen,
          element,
          property: "(element)",
          before: a ? "there" : "—",
          after: b ? "there" : "—",
        });
        continue;
      }
      for (const property of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (a[property] !== b[property])
          differences.push({ screen, element, property, before: a[property] ?? "—", after: b[property] ?? "—" });
      }
    }
  }
  return differences;
}

/** The run's summary, in Markdown: what it was compared with (`main` at abc1234), and every difference. */
export function report(differences: Difference[], against: string, lookChange: boolean) {
  if (!differences.length) return `**Looks the same** as ${against}: every element, every property.\n`;
  const lines = [
    lookChange
      ? `**${differences.length} differences** from ${against}, expected: this PR is labelled \`look change\`.`
      : `**${differences.length} differences** from ${against}. If the PR changes the look on purpose, label it \`look change\`; if \`main\` moved on, update the branch.`,
    "",
    "| Screen | Element | Property | `main` | This branch |",
    "| --- | --- | --- | --- | --- |",
    ...differences.map((d) => `| ${d.screen} | \`${d.element}\` | ${d.property} | \`${d.before}\` | \`${d.after}\` |`),
  ];
  return `${lines.join("\n")}\n`;
}
