import { describe, expect, it } from "vitest";
import { pointerInside } from "./pointer-inside.util";

/** The player: 200×100 px at 100,100. */
const player = () => DOMRect.fromRect({ x: 100, y: 100, width: 200, height: 100 });

describe("a pointer inside the player", () => {
  it("is inside strictly within its edges", () => {
    expect(pointerInside({ clientX: 150, clientY: 150 }, player())).toBe(true);
  });

  it("is outside past or on an edge", () => {
    expect(pointerInside({ clientX: 100, clientY: 150 }, player())).toBe(false);
    expect(pointerInside({ clientX: 350, clientY: 150 }, player())).toBe(false);
    expect(pointerInside({ clientX: 150, clientY: 200 }, player())).toBe(false);
  });
});
