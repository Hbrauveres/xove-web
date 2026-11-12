import { expect, it, vi } from "vitest";
import { slotBox } from "./slot-box.util";

it("is the picture's place in its slot by layout, whatever moves the picture on screen", () => {
  const anchor = document.createElement("li");
  const picture = anchor.appendChild(document.createElement("span"));
  vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(new DOMRect(40, 100, 128, 80));
  for (const [k, v] of Object.entries({ offsetLeft: 0, offsetTop: 4, offsetWidth: 128, offsetHeight: 72 }))
    Object.defineProperty(picture, k, { value: v });
  // A swap's bounce: the picture drawn 6 px right, 5 px up and scaled.
  vi.spyOn(picture, "getBoundingClientRect").mockReturnValue(new DOMRect(46, 99, 123, 69));
  expect(slotBox(anchor, picture)).toEqual(new DOMRect(40, 104, 128, 72));
});
