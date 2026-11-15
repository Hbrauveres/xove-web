import { expect, it } from "vitest";
import { firstName } from "./first-name.util";

it("takes the first word of a name, and says member without one", () => {
  expect(firstName("Ana Souza")).toBe("Ana");
  expect(firstName(null)).toBe("member");
  expect(firstName("")).toBe("member");
});
