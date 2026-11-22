// Finding strings and comments in a text by walking it once. A regular expression for these takes
// time that grows with the square of the text when a quote or a comment is never closed, so the checks
// use these instead: no regular expression in the checks may be one some input can make slow.

/**
 * Where each quoted string starts and ends ([from, to), quotes included). A quote not closed on its own line
 * opens no string: in a comment it's an apostrophe ("it's"), and it mustn't hide what follows.
 */
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
    while (end < text.length && text.charAt(end) !== quote && text.charAt(end) !== "\n")
      end += text.charAt(end) === "\\" ? 2 : 1;
    if (text.charAt(end) !== quote) {
      at += 1;
      continue;
    }
    spans.push([at, end + 1]);
    at = end + 1;
  }
  return spans;
}

/** Each `name(…)` call's span, its parentheses balanced (`:global(.a:not(.b))` whole); an unclosed one runs to the end. */
export function callSpans(text: string, name: string): [number, number][] {
  const spans: [number, number][] = [];
  let from = text.indexOf(`${name}(`);
  while (from >= 0) {
    let at = from + name.length + 1;
    for (let depth = 1; at < text.length && depth > 0; at += 1) {
      if (text.charAt(at) === "(") depth += 1;
      else if (text.charAt(at) === ")") depth -= 1;
    }
    spans.push([from, at]);
    from = text.indexOf(`${name}(`, at);
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
