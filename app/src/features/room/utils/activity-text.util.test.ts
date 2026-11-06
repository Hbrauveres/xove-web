import { describe, expect, it } from "vitest";
import type { ActivityEvent } from "../types/room-view.types";
import { describeEvent } from "./activity-text.util";

const nameOf = (id: string) => (id === "ana" ? "Ana" : "Someone");
const event = (e: Partial<ActivityEvent>): ActivityEvent => ({ id: "1", kind: "joined", actorId: "ana", at: 0, ...e });

describe("what happened, in words", () => {
  it("names who did it, or says You for me", () => {
    expect(describeEvent(event({ kind: "joined" }), nameOf, "me")).toBe("Ana joined");
    expect(describeEvent(event({ kind: "left", actorId: "me" }), nameOf, "me")).toBe("You left");
  });

  it("tells a screen from a camera, with their or your", () => {
    expect(describeEvent(event({ kind: "started", stream: "screen" }), nameOf, "me")).toBe("Ana started sharing");
    expect(describeEvent(event({ kind: "stopped", stream: "screen" }), nameOf, "me")).toBe("Ana stopped sharing");
    expect(describeEvent(event({ kind: "started", stream: "camera" }), nameOf, "me")).toBe(
      "Ana turned on their camera",
    );
    expect(describeEvent(event({ kind: "stopped", stream: "camera", actorId: "me" }), nameOf, "me")).toBe(
      "You turned off your camera",
    );
  });

  it("says Reconnected without a name", () => {
    expect(describeEvent(event({ kind: "reconnected" }), nameOf, "me")).toBe("Reconnected");
  });
});
