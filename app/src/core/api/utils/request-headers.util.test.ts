import { describe, expect, it } from "vitest";
import { requestHeaders } from "./request-headers.util";

describe("requestHeaders", () => {
  it("asks for JSON, and says the body is JSON only when there is one", () => {
    expect(requestHeaders(false, undefined)).toEqual({ Accept: "application/json" });
    expect(requestHeaders(true, undefined)).toEqual({ Accept: "application/json", "Content-Type": "application/json" });
  });

  it("echoes the CSRF token when given one", () => {
    expect(requestHeaders(false, "abc")["X-XSRF-TOKEN"]).toBe("abc");
  });
});
