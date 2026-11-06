import { describe, expect, it } from "vitest";
import { rowTab } from "./row-tab.util";

const page = () => {
  document.body.innerHTML = `<li id="preview"><button id="watch"></button></li><button id="next"></button>
    <div id="row"><button id="first"></button><button id="last"></button></div>`;
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  return { el, row: el("row"), preview: el("preview") };
};

describe("rowTab", () => {
  it("Shift+Tab from the first stop goes back to the preview", () => {
    const { el, row, preview } = page();
    expect(rowTab(el("first"), true, row, preview)).toBe(el("watch"));
  });

  it("Tab from the last stop goes on to what follows the preview", () => {
    const { el, row, preview } = page();
    expect(rowTab(el("last"), false, row, preview)).toBe(el("next"));
  });

  it("anywhere else, leaves Tab alone", () => {
    const { el, row, preview } = page();
    expect(rowTab(el("first"), false, row, preview)).toBeUndefined();
    expect(rowTab(el("last"), true, row, preview)).toBeUndefined();
  });
});
