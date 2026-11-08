import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { holdGroup } from "./hold-group.util";

describe("a group holds the part under the pointer when something pushes it", () => {
  /** This test's own ResizeObserver: `resize.now()` tells the group something changed; `observed` what it watches. */
  function onResize() {
    const resize = { now: () => {}, observed: [] as Element[] };
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          resize.now = cb;
        }
        observe(el: Element) {
          resize.observed.push(el);
        }
        disconnect() {}
      },
    );
    return resize;
  }
  /** A row with one button, placed where `at` says. */
  function row(at: { x: number; y: number }) {
    const group = document.body.appendChild(document.createElement("div"));
    const button = group.appendChild(document.createElement("button"));
    button.getBoundingClientRect = () => DOMRect.fromRect({ x: at.x, y: at.y, width: 48, height: 48 });
    return { group, button };
  }

  it("moves the group back across when the part under the pointer is pushed, and glides back once it leaves", () => {
    const resize = onResize();
    const at = { x: 400, y: 0 };
    const { group, button } = row(at);
    const stop = holdGroup(group);
    fireEvent.pointerOver(button);
    // The camera's arrow went away and the centred row pushed the camera 9 px right.
    at.x = 409;
    resize.now();
    expect(group.style.transform).toBe("translateX(-9px)");
    expect(group.style.transition).toBe("none");
    fireEvent.pointerLeave(group);
    expect(group.style.transform).toBe("");
    expect(group.style.transition).toContain("220ms");
    stop();
    group.remove();
  });

  it("holds down as well, and watches what it's told to", () => {
    const resize = onResize();
    const sibling = document.createElement("div");
    const at = { x: 100, y: 300 };
    const { group, button } = row(at);
    const stop = holdGroup(group, [sibling]);
    expect(resize.observed).toEqual([group, sibling]);
    fireEvent.pointerOver(button);
    at.y = 312;
    resize.now();
    expect(group.style.transform).toBe("translate(0px, -12px)");
    stop();
    group.remove();
  });

  it("does nothing while the pointer isn't on the group", () => {
    const resize = onResize();
    const at = { x: 400, y: 0 };
    const { group } = row(at);
    const stop = holdGroup(group);
    at.x = 420;
    resize.now();
    expect(group.style.transform).toBe("");
    stop();
    group.remove();
  });

  it("keeps the group's own transitions while it holds and glides back", () => {
    const resize = onResize();
    const at = { x: 400, y: 0 };
    const { group, button } = row(at);
    group.style.transition = "width 350ms ease";
    const stop = holdGroup(group);
    fireEvent.pointerOver(button);
    at.x = 300;
    resize.now();
    expect(group.style.transform).toBe("translateX(100px)");
    expect(group.style.transition).toBe("width 350ms ease");
    fireEvent.pointerLeave(group);
    expect(group.style.transition).toMatch(/^width 350ms ease, transform 220ms/);
    stop();
    group.remove();
  });

  it("ignores a 'left' sent while the pointer is still where the held part is, until it moves off it", () => {
    const resize = onResize();
    const at = { x: 400, y: 0 };
    const { group, button } = row(at);
    const stop = holdGroup(group);
    fireEvent.pointerOver(button);
    at.x = 300;
    resize.now();
    expect(group.style.transform).toBe("translateX(100px)");
    // The browser re-checks under a still pointer mid-glide and says it left: it's still on the part.
    fireEvent.pointerLeave(group, { clientX: 420, clientY: 20 });
    expect(group.style.transform).toBe("translateX(100px)");
    // It really moves off: the group glides back.
    fireEvent.pointerMove(document, { clientX: 900, clientY: 300 });
    expect(group.style.transform).toBe("");
    stop();
    group.remove();
  });

  it("keeps its part when another slides under a pointer that didn't move", () => {
    const resize = onResize();
    const at = { x: 400, y: 0 };
    const { group, button } = row(at);
    const other = group.appendChild(document.createElement("button"));
    other.getBoundingClientRect = () => DOMRect.fromRect({ x: 450, y: 0, width: 48, height: 48 });
    const stop = holdGroup(group);
    fireEvent.pointerOver(button, { clientX: 420, clientY: 20 });
    fireEvent.pointerMove(document, { clientX: 420, clientY: 20 });
    at.x = 380;
    resize.now();
    expect(group.style.transform).toBe("translateX(20px)");
    // Mid-glide the browser re-checks under the still pointer and finds the other button there.
    fireEvent.pointerOver(other, { clientX: 420, clientY: 20 });
    // Its box, the hold's shift included, is pushed 40 px more: held 60 px in all.
    at.x = 360;
    resize.now();
    expect(group.style.transform).toBe("translateX(60px)");
    stop();
    group.remove();
  });
});
