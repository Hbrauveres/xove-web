import { describe, expect, it } from "vitest";
import { knownKeyOf, shouldReport, targetOf, wantedKeyOf } from "../../utils/watch-report.util";

describe("the watch report's rules", () => {
  it("says what's on my stage as a key, nothing as none, and nothing to say until the room knows", () => {
    expect(wantedKeyOf({ personId: "user-42", kind: "camera" })).toBe("42|camera");
    expect(wantedKeyOf(null)).toBe("none");
    expect(wantedKeyOf(undefined)).toBeUndefined();
  });

  it("reads what the API last knew of my stage, and nothing from an older API", () => {
    expect(knownKeyOf({ "user-7": { sharerId: "user-42", kind: "screen" } }, "user-7")).toBe("42|screen");
    expect(knownKeyOf({}, "user-7")).toBe("none");
    expect(knownKeyOf(null, "user-7")).toBeUndefined();
  });

  it("reports only what the API doesn't know yet, and only from a page in the video room", () => {
    expect(shouldReport("42|screen", "none", undefined, true)).toBe(true);
    expect(shouldReport("42|screen", "42|screen", undefined, true)).toBe(false);
    expect(shouldReport("42|screen", "none", undefined, false)).toBe(false);
    expect(shouldReport(undefined, "none", undefined, true)).toBe(false);
  });

  it("reports again when the API lost what it was told (after a restart)", () => {
    expect(shouldReport("42|screen", "none", "42|screen", true)).toBe(true);
  });

  it("with an older API that lists no watches, reports a change once", () => {
    expect(shouldReport("42|screen", undefined, undefined, true)).toBe(true);
    expect(shouldReport("42|screen", undefined, "42|screen", true)).toBe(false);
  });

  it("turns a key back into the report", () => {
    expect(targetOf("42|camera")).toEqual({ sharerId: 42, kind: "camera" });
    expect(targetOf("none")).toBeNull();
  });
});
