import { describe, expect, it } from "vitest";
import { tabCycle } from "./tab-cycle.util";

/** A box with two buttons, like the offer. */
function twoButtons() {
  const root = document.createElement("div");
  root.innerHTML = "<button>Enter room</button><button>Cancel</button>";
  const [first, last] = [...root.querySelectorAll("button")];
  return { root, first: first!, last: last! };
}

describe("Tab going round", () => {
  it("goes from the last stop back to the first, and with Shift from the first to the last", () => {
    const { root, first, last } = twoButtons();
    expect(tabCycle(root, last, false)).toBe(first);
    expect(tabCycle(root, first, true)).toBe(last);
  });

  it("leaves the browser's own step alone inside", () => {
    const { root, first, last } = twoButtons();
    expect(tabCycle(root, first, false)).toBeUndefined();
    expect(tabCycle(root, last, true)).toBeUndefined();
  });
});
