import { describe, expect, it } from "vitest";
import { problemOf } from "./voice-problem.util";

describe("problemOf", () => {
  it("says missing when there's no mic, or none that fits", () => {
    expect(problemOf(new DOMException("", "NotFoundError"))).toBe("missing");
    expect(problemOf(new DOMException("", "OverconstrainedError"))).toBe("missing");
  });

  it("says blocked for a refusal or anything else", () => {
    expect(problemOf(new DOMException("", "NotAllowedError"))).toBe("blocked");
    expect(problemOf(new Error("boom"))).toBe("blocked");
  });
});
