import { describe, expect, it, vi } from "vitest";
import { FloatingStore } from "./floating.store";
import type { Floating, FloatingKind } from "./types/floating.types";

function setup() {
  const store = new FloatingStore();
  const made: HTMLElement[] = [];
  const box = (parent: HTMLElement = document.body) => {
    const el = parent.appendChild(document.createElement("div"));
    el.tabIndex = -1;
    made.push(el);
    return el;
  };
  const thing = (kind: FloatingKind, parent?: HTMLElement) => {
    const area = box(parent);
    const anchor = box(parent);
    const f: Floating = { kind, close: vi.fn(() => store.remove(f)), area: () => area, anchor: () => anchor };
    return { f, area, anchor };
  };
  return { store, box, thing };
}

describe("one thing on screen at a time", () => {
  it("something opened closes what's showing, of any kind", () => {
    const { store, thing } = setup();
    const [panel, rest, tip, next] = [thing("opened"), thing("rest"), thing("tooltip"), thing("opened")];
    store.add(panel.f);
    store.add(rest.f);
    store.add(tip.f);
    store.add(next.f);
    expect(panel.f.close).toHaveBeenCalled();
    expect(rest.f.close).toHaveBeenCalled();
    expect(tip.f.close).toHaveBeenCalled();
    expect(next.f.close).not.toHaveBeenCalled();
  });

  it("what's inside another stays with it", () => {
    const { store, thing } = setup();
    const panel = thing("opened");
    const picker = thing("opened", panel.area);
    store.add(panel.f);
    store.add(picker.f);
    expect(panel.f.close).not.toHaveBeenCalled();
  });

  it("a rest isn't allowed over what I opened, but is inside it", () => {
    const { store, thing, box } = setup();
    const panel = thing("opened");
    expect(store.canRest(box())).toBe(true);
    store.add(panel.f);
    expect(store.canRest(box())).toBe(false);
    expect(store.canRest(box(panel.area))).toBe(true);
  });

  it("a tooltip replaces a tooltip and what opened on a rest, and leaves what I opened", () => {
    const { store, thing } = setup();
    const [panel, rest, tip, next] = [thing("opened"), thing("rest"), thing("tooltip"), thing("tooltip")];
    store.add(rest.f);
    store.add(tip.f);
    expect(rest.f.close).toHaveBeenCalled();
    store.add(panel.f);
    expect(tip.f.close).toHaveBeenCalled();
    store.add(next.f);
    expect(panel.f.close).not.toHaveBeenCalled();
  });

  it("clears the way for a rest, keeping what it's told to", () => {
    const { store, thing } = setup();
    const [rest, tip, panel] = [thing("rest"), thing("tooltip"), thing("opened")];
    store.add(panel.f);
    store.add(rest.f);
    store.add(tip.f);
    store.clearForRest(tip.f.close);
    expect(rest.f.close).toHaveBeenCalled();
    expect(tip.f.close).not.toHaveBeenCalled();
    expect(panel.f.close).not.toHaveBeenCalled();
  });
});

describe("closing", () => {
  const press = (el: Element) => el.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  const escape = () => {
    const e = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.body.dispatchEvent(e);
    return e;
  };

  it("a press outside closes it; one inside it or on its button doesn't", () => {
    const { store, thing, box } = setup();
    const panel = thing("opened");
    store.add(panel.f);
    press(panel.area);
    press(panel.anchor);
    expect(panel.f.close).not.toHaveBeenCalled();
    press(box());
    expect(panel.f.close).toHaveBeenCalledOnce();
  });

  it("a press inside a picker keeps the panel it's in", () => {
    const { store, thing } = setup();
    const panel = thing("opened");
    const picker = thing("opened", panel.area);
    store.add(panel.f);
    store.add(picker.f);
    press(picker.area);
    expect(panel.f.close).not.toHaveBeenCalled();
    expect(picker.f.close).not.toHaveBeenCalled();
  });

  it("Escape closes the innermost only, returns focus to its button, and goes no further", () => {
    const { store, thing } = setup();
    const panel = thing("opened");
    const picker = thing("opened", panel.area);
    store.add(panel.f);
    store.add(picker.f);
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    escape();
    document.removeEventListener("keydown", outer);
    expect(picker.f.close).toHaveBeenCalledOnce();
    expect(panel.f.close).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(picker.anchor);
    expect(outer).not.toHaveBeenCalled();
    store.reset();
  });

  it("with nothing floating, Escape and presses are the page's", () => {
    const { store, thing } = setup();
    const tip = thing("opened");
    store.add(tip.f);
    store.remove(tip.f);
    expect(escape().defaultPrevented).toBe(false);
  });
});
