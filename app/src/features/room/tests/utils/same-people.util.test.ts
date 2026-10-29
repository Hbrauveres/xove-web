import { describe, expect, it } from "vitest";
import { samePeople } from "../../utils/same-people.util";

describe("samePeople", () => {
  it("is true only for the same ids in the same order", () => {
    expect(samePeople(["user-1", "user-2"], ["user-1", "user-2"])).toBe(true);
    expect(samePeople(["user-1", "user-2"], ["user-2", "user-1"])).toBe(false);
    expect(samePeople(["user-1"], ["user-1", "user-2"])).toBe(false);
  });
});
