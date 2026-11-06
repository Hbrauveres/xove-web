import { describe, expect, it } from "vitest";
import { shortAgo, timeAgo } from "./time-ago.util";

const now = 1_000_000_000_000;

describe("how long ago", () => {
  it('is "now" under 45 seconds', () => {
    expect(shortAgo(now - 44_000, now)).toBe("now");
    expect(timeAgo(now - 30_000, now)).toBe("just now");
  });

  it("counts minutes from 45 seconds", () => {
    expect(shortAgo(now - 45_000, now)).toBe("1 min");
    expect(timeAgo(now - 4 * 60_000, now)).toBe("4 min ago");
  });

  it("switches to hours at 60 minutes", () => {
    expect(shortAgo(now - 60 * 60_000, now)).toBe("1 h");
    expect(timeAgo(now - 60 * 60_000, now)).toBe("1 h ago");
  });
});
