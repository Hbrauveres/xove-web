import { describe, expect, it } from "vitest";
import { keepSame } from "../../utils/keep-same.util";

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
