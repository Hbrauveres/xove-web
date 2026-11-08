/** Whether `el`'s text, or some text in it, is cut: it has less room than the text needs. */
export function textCut(el: Element | null): boolean {
  if (!el) return false;
  return [el, ...el.querySelectorAll("*")].some((e) => e.scrollWidth > e.clientWidth);
}
