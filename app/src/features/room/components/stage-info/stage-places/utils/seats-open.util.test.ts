import { expect, it } from "vitest";
import { seatsOpen } from "./seats-open.util";

it("says the places left, one or many", () => {
  expect(seatsOpen(1)).toBe("1 seat open");
  expect(seatsOpen(3)).toBe("3 seats open");
});
