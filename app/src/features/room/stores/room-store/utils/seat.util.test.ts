import { describe, expect, it } from "vitest";
import { waitingFor } from "./seat.util";

describe("waitingFor", () => {
  it("is true until the seat is mine: not asked yet, in line, or offered", () => {
    expect(waitingFor(null)).toBe(true);
    expect(waitingFor({ status: "waiting", place: 2 })).toBe(true);
    expect(waitingFor({ status: "offered", until: "2026-10-29T10:00:30Z", seconds: 30 })).toBe(true);
  });

  it("is false once I'm in, or after I left", () => {
    expect(waitingFor({ status: "in" })).toBe(false);
    expect(waitingFor({ status: "left" })).toBe(false);
  });
});
