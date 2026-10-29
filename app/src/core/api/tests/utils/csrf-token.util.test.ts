import { describe, expect, it } from "vitest";
import { csrfTokenFrom } from "../../utils/csrf-token.util";

describe("csrfTokenFrom", () => {
  it("reads the token among other cookies, decoded", () => {
    expect(csrfTokenFrom("theme=dark; XSRF-TOKEN=a%2Bb; lang=pt")).toBe("a+b");
  });

  it("gives nothing when there's no token", () => {
    expect(csrfTokenFrom("theme=dark")).toBeUndefined();
    expect(csrfTokenFrom("")).toBeUndefined();
  });
});
