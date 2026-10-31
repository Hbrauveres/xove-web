import { describe, expect, it } from "vitest";
import type { Floating } from "../types/floating.types";
import { belongsTo, buttonIn } from "./floating.util";

const element = (tag = "div") => document.createElement(tag);
const floating = (area: Element | null, anchor: HTMLElement | null = null): Floating => ({
  kind: "rest",
  close: () => {},
  area: () => area,
  anchor: () => anchor,
});

describe("what floats, between two things", () => {
  it("the focus goes to the button inside the anchor's wrapper, or to the anchor", () => {
    const wrapper = element("span");
    const button = wrapper.appendChild(element("button"));
    expect(buttonIn(wrapper)).toBe(button);
    expect(buttonIn(button)).toBe(button);
    expect(buttonIn(null)).toBeNull();
  });

  it("something belongs to what holds its button or its area", () => {
    const outer = element();
    const button = outer.appendChild(element("button"));
    const inner = outer.appendChild(element());
    expect(belongsTo(floating(null, button), floating(outer))).toBe(true);
    expect(belongsTo(floating(inner), floating(outer))).toBe(true);
    expect(belongsTo(floating(element()), floating(outer))).toBe(false);
  });

  it("something showing over another's button belongs to it", () => {
    const preview = element();
    const button = preview.appendChild(element("button"));
    expect(belongsTo(floating(null, button), floating(element(), preview))).toBe(true);
  });
});
