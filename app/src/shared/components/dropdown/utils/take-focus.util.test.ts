import { expect, it } from "vitest";
import { takeFocus } from "./take-focus.util";

function panel(inner: string) {
  const el = document.body.appendChild(document.createElement("div"));
  el.tabIndex = -1;
  el.innerHTML = inner;
  return el;
}

it("a menu focuses its first item", () => {
  const el = panel('<button>Not this</button><button role="menuitem">This</button>');
  takeFocus(el, "menu");
  expect(document.activeElement?.textContent).toBe("This");
});

it("a dialog focuses what's marked, or itself", () => {
  const marked = panel("<button>Not this</button><button data-autofocus>This</button>");
  takeFocus(marked, "dialog");
  expect(document.activeElement?.textContent).toBe("This");
  const plain = panel("<button>Not this</button>");
  takeFocus(plain, "dialog");
  expect(plain).toHaveFocus();
});
