import { describe, expect, it } from "vitest";
import { queueMessage } from "./queue-message.util";

describe("what the waiting room says", () => {
  it("is looking for a seat until the API answers", () => {
    expect(queueMessage(null)).toEqual({ title: null, text: "Looking for a seat…", canRejoin: false });
  });

  it("says my place in the line, and next when it's mine (an offer too)", () => {
    expect(queueMessage({ status: "waiting", place: 3 }).text).toMatch(
      /^You're number 3 in line\. Keep this page open/,
    );
    expect(queueMessage({ status: "waiting", place: 1 }).text).toMatch(/^You're next in line\./);
    expect(queueMessage({ status: "offered", until: "", seconds: 30 }).text).toMatch(/^You're next in line\./);
    expect(queueMessage({ status: "waiting", place: 3 }).title).toBe("The room is full");
  });

  it("offers to join again after I leave", () => {
    expect(queueMessage({ status: "left" })).toMatchObject({ title: "You left the queue", canRejoin: true });
  });
});
