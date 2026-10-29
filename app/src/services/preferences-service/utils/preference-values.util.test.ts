import { describe, expect, it } from "vitest";
import { between0and1, isMode, processingFrom } from "./preference-values.util";

describe("between0and1", () => {
  it("keeps a number inside 0 to 1", () => {
    expect(between0and1(0.4, 1)).toBe(0.4);
    expect(between0and1(3, 1)).toBe(1);
    expect(between0and1(-2, 1)).toBe(0);
  });

  it("gives the fallback for something that isn't a number", () => {
    expect(between0and1(Number.NaN, 0.7)).toBe(0.7);
  });
});

describe("isMode", () => {
  it("knows the stream modes, and nothing else", () => {
    expect(isMode("smooth")).toBe(true);
    expect(isMode("sharp")).toBe(true);
    expect(isMode("blurry")).toBe(false);
    expect(isMode(null)).toBe(false);
  });
});

describe("processingFrom", () => {
  it("reads the saved processing", () => {
    expect(processingFrom('{"echoCancellation":false}')).toEqual({ echoCancellation: false });
  });

  it("gives nothing for no text, broken JSON or something that isn't an object", () => {
    expect(processingFrom(null)).toEqual({});
    expect(processingFrom("{oops")).toEqual({});
    expect(processingFrom("3")).toEqual({});
  });
});
