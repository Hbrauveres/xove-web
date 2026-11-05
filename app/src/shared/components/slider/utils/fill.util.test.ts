import { expect, it } from "vitest";
import { fillOf } from "./fill.util";

it("fills the share of the track the value covers, kept between empty and full", () => {
  expect(fillOf(0.5, 0, 1)).toBe("50%");
  expect(fillOf(1 / 3, 0, 1)).toBe("33.33%");
  expect(fillOf(2, 0, 1)).toBe("100%");
  expect(fillOf(-1, 0, 1)).toBe("0%");
});

it("is empty without a number or a range", () => {
  expect(fillOf(undefined, 0, 1)).toBe("0%");
  expect(fillOf(5, 1, 1)).toBe("0%");
});
