import { expect, it } from "vitest";
import { applyFrame } from "./apply-frame.util";

function svg() {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.innerHTML = '<g data-letters></g><g data-side="top-left"></g><rect data-wipe /><circle data-dot transform="x" />';
  return el;
}

it("moves each part, and takes the dot's squash off when it's round", () => {
  const el = svg();
  applyFrame(el, {
    letters: "translate(-5,0)",
    corners: { "top-left": "translate(0,2)", "bottom-left": "", "bottom-right": "", "top-right": "" },
    wipe: { x: 10, width: 40 },
    dot: null,
  });
  expect(el.querySelector("[data-letters]")?.getAttribute("transform")).toBe("translate(-5,0)");
  expect(el.querySelector('[data-side="top-left"]')?.getAttribute("transform")).toBe("translate(0,2)");
  expect(el.querySelector("[data-wipe]")?.getAttribute("width")).toBe("40");
  expect(el.querySelector("[data-dot]")?.hasAttribute("transform")).toBe(false);
});
