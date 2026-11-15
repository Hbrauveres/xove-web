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

describe("firstName on a button", () => {
  it("says the place's own word without a name: Remove member", () => {
    expect(firstName("Ana Souza", "member")).toBe("Ana");
    expect(firstName(null, "member")).toBe("member");
  });
});
