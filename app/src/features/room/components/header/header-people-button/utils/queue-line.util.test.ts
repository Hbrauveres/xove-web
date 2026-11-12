import { describe, expect, it } from "vitest";
import { queueLine } from "./queue-line.util";

describe("the queue's line", () => {
  it("says nobody, one person, or how many people wait", () => {
    expect(queueLine(0)).toBe("Nobody is waiting for a seat.");
    expect(queueLine(1)).toBe("1 person is waiting for a seat.");
    expect(queueLine(3)).toBe("3 people are waiting for a seat.");
  });
});
