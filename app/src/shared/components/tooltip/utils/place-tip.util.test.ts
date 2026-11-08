import { expect, it } from "vitest";
import { placeTip } from "./place-tip.util";

const control = (left: number, top: number) => new DOMRect(left, top, 40, 40);

it("sits above its control, centred", () => {
  expect(placeTip(control(500, 500), { width: 100, height: 20 }, 1920)).toEqual({ left: 470, top: 470 });
});

it("stays within the window, and goes below where there's no room above", () => {
  expect(placeTip(control(0, 5), { width: 100, height: 20 }, 1920)).toEqual({ left: 8, top: 55 });
  expect(placeTip(control(1880, 500), { width: 100, height: 20 }, 1920).left).toBe(1812);
});

it("beside: right of its control, centred on it, or left of it where the window has no room", () => {
  expect(placeTip(control(500, 500), { width: 100, height: 20 }, 1920, "beside")).toEqual({ left: 550, top: 510 });
  expect(placeTip(control(1800, 500), { width: 100, height: 20 }, 1920, "beside")).toEqual({ left: 1690, top: 510 });
});
