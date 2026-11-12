import { describe, expect, it } from "vitest";
import { chromeKept } from "./chrome-kept.util";

describe("whether the controls stay up", () => {
  const none = { held: 0, onControl: false, keyboard: false };
  const player = (inner = "") => {
    const frame = document.body.appendChild(document.createElement("div"));
    frame.innerHTML = inner;
    return frame;
  };

  it("not by themselves", () => {
    expect(chromeKept(player('<button aria-expanded="false">Go live</button>'), none)).toBe(false);
  });

  it("while something holds them, or the pointer rests on one", () => {
    expect(chromeKept(player(), { ...none, held: 1 })).toBe(true);
    expect(chromeKept(player(), { ...none, onControl: true })).toBe(true);
  });

  it("while a control's menu is open in the player", () => {
    expect(chromeKept(player('<button aria-expanded="true">Go live</button>'), none)).toBe(true);
  });

  it("while a control in it has the keyboard's focus, not a click's", () => {
    const frame = player("<button>Go live</button>");
    frame.querySelector("button")?.focus();
    expect(chromeKept(frame, { ...none, keyboard: true })).toBe(true);
    expect(chromeKept(frame, none)).toBe(false);
  });
});
