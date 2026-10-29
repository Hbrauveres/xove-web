import { describe, expect, it, vi } from "vitest";
import { readStored, writeStored } from "./storage.service";

describe("the browser's storage", () => {
  it("keeps a value and gives it back", () => {
    writeStored("xove.test", "on");
    expect(readStored("xove.test")).toBe("on");
  });

  it("gives nothing and breaks nothing when the browser blocks it", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(() => writeStored("xove.test", "on")).not.toThrow();
    expect(readStored("xove.test")).toBeNull();
  });
});
