import { describe, expect, it } from "vitest";
import { keepSame, samePeople } from "./keep-same.util";

describe("keepSame", () => {
  it("keeps the old record when every value is the same", () => {
    const before = { a: 1, b: [2] };
    expect(keepSame(before, { a: 1, b: [2] })).toBe(before);
  });

  it("takes the new record when a value or a key changed, or there was none", () => {
    const now: Record<string, number> = { a: 2 };
    expect(keepSame({ a: 1 }, now)).toBe(now);
    expect(keepSame({ a: 2, b: 1 }, now)).toBe(now);
    expect(keepSame(null, now)).toBe(now);
  });
});

describe("samePeople", () => {
  it("is true only for the same ids in the same order", () => {
    expect(samePeople(["user-1", "user-2"], ["user-1", "user-2"])).toBe(true);
    expect(samePeople(["user-1", "user-2"], ["user-2", "user-1"])).toBe(false);
    expect(samePeople(["user-1"], ["user-1", "user-2"])).toBe(false);
  });
});
