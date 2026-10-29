import { describe, expect, it } from "vitest";
import { personIdOf, userIdOf } from "../../utils/person-id.util";

describe("person ids", () => {
  it("turn a user id into a room id and back", () => {
    expect(personIdOf(42)).toBe("user-42");
    expect(userIdOf(personIdOf(42))).toBe(42);
  });
});
