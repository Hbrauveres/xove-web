/** Where the page draws the app (index.html's #root); a clear error if it's missing. */
export function rootElement(page: Document): HTMLElement {
  const root = page.getElementById("root");
  if (!root) throw new Error("The page has no #root element to draw the app in.");
  return root;
}
