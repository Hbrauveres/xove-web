import { expect, it } from "vitest";
import { moveInMenu } from "./move-in-menu.util";

const key = (name: string) => new KeyboardEvent("keydown", { key: name, cancelable: true });

function menu() {
  const el = document.body.appendChild(document.createElement("div"));
  const add = () => {
    const item = el.appendChild(document.createElement("button"));
    item.setAttribute("role", "menuitem");
    return item;
  };
  return { el, first: add(), second: add() };
}

it("arrows move through the items, round at both ends; other keys do nothing", () => {
  const { el, first, second } = menu();
  first.focus();
  moveInMenu(el, key("ArrowDown"));
  expect(second).toHaveFocus();
  moveInMenu(el, key("ArrowDown"));
  expect(first).toHaveFocus();
  moveInMenu(el, key("ArrowUp"));
  expect(second).toHaveFocus();
  moveInMenu(el, key("Tab"));
  expect(second).toHaveFocus();
});
