// Finding strings and comments in a text by walking it once. A regular expression for these takes
// time that grows with the square of the text when a quote or a comment is never closed, so the checks
// use these instead: no regular expression in the checks may be one some input can make slow.

/** Where each quoted string starts and ends ([from, to), quotes included); one never closed runs to the end. */
export function stringSpans(text: string, quotes = "\"'`"): [number, number][] {
  const spans: [number, number][] = [];
  let at = 0;
  while (at < text.length) {
    const quote = text.charAt(at);
    if (!quotes.includes(quote)) {
      at += 1;
      continue;
    }
    let end = at + 1;
    while (end < text.length && text.charAt(end) !== quote) end += text.charAt(end) === "\\" ? 2 : 1;
    spans.push([at, Math.min(end + 1, text.length)]);
    at = end + 1;
  }
  return spans;
}

/** Each `/* … *\/` comment's span; an unclosed one is left alone, as the CSS parser would read it. */
export function commentSpans(css: string): [number, number][] {
  const spans: [number, number][] = [];
  let from = css.indexOf("/*");
  while (from >= 0) {
    const to = css.indexOf("*/", from + 2);
    if (to < 0) break;
    spans.push([from, to + 2]);
    from = css.indexOf("/*", to + 2);
  }
  return spans;
}

/**
 * The text with each span (in order, none overlapping) turned to spaces, its line breaks kept so lines keep
 * their numbers; or, given `by`, replaced by that.
 */
export function blank(text: string, spans: [number, number][], by?: string) {
  let out = "";
  let last = 0;
  for (const [from, to] of spans) {
    out += text.slice(last, from) + (by ?? text.slice(from, to).replace(/[^\n]/g, " "));
    last = to;
  }
  return out + text.slice(last);
}

/** A stylesheet with its comments blanked out. */
export const withoutComments = (css: string) => blank(css, commentSpans(css));
