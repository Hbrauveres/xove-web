import { fireEvent, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useMenuArrows } from "./use-menu-arrows.hook";

function menu() {
  const el = document.body.appendChild(document.createElement("div"));
  const add = () => {
    const item = el.appendChild(document.createElement("button"));
    item.setAttribute("role", "menuitem");
    return item;
  };
  return { el, first: add(), second: add() };
}

it("moves through the items only while active", () => {
  const { el, first, second } = menu();
  const { rerender } = renderHook(({ active }) => useMenuArrows({ current: el }, active), {
    initialProps: { active: false },
  });
  first.focus();
  fireEvent.keyDown(first, { key: "ArrowDown" });
  expect(first).toHaveFocus();
  rerender({ active: true });
  fireEvent.keyDown(first, { key: "ArrowDown" });
  expect(second).toHaveFocus();
});
