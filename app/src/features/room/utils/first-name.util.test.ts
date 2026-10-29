import { describe, expect, it } from "vitest";
import { firstName } from "./first-name.util";

describe("firstName", () => {
  it("is the first word of the name", () => {
    expect(firstName("  Marina Souza ")).toBe("Marina");
  });

  it("is Someone without a name", () => {
    expect(firstName(null)).toBe("Someone");
    expect(firstName("   ")).toBe("Someone");
  });
});
