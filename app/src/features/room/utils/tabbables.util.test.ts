import { describe, expect, it } from "vitest";
import { tabbableAfter, tabbables } from "./tabbables.util";

const page = (html: string) => {
  document.body.innerHTML = html;
  return (id: string) => document.getElementById(id) as HTMLElement;
};

describe("tabbables", () => {
  it("lists what Tab stops at, skipping what's inert, disabled or taken out", () => {
    const el = page(`<div id="root"><button id="a"></button><button disabled></button>
      <span inert><button></button></span><input id="b" /><span tabindex="-1"></span></div>`);
    expect(tabbables(el("root")).map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("finds the first stop after a place, past what to skip", () => {
    const el = page(`<li id="preview"><button></button></li><button id="next"></button>
      <div id="row"><button></button></div>`);
    expect(tabbableAfter(el("preview"), el("row"))).toBe(el("next"));
  });
});
