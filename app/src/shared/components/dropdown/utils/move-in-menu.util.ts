/** An arrow key moves the focus through a menu's items, round at both ends. */
export function moveInMenu(menu: HTMLElement, e: KeyboardEvent) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const items = [...menu.querySelectorAll<HTMLElement>("[role^=menuitem]")];
  const at = items.findIndex((item) => item === document.activeElement);
  items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
}
