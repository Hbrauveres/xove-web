import { describe, expect, it } from "vitest";
import { personName } from "./person-name.util";

const people = [{ id: "ana", name: "Ana", hue: 300, online: true }];

describe("a person's name", () => {
  it("is their name when known", () => {
    expect(personName(people, "ana")).toBe("Ana");
  });

  it("is Someone, or the given word, when not", () => {
    expect(personName(people, "gone")).toBe("Someone");
    expect(personName(people, "gone", "someone")).toBe("someone");
  });
});
