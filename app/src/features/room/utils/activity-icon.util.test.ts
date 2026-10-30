import { describe, expect, it } from "vitest";
import type { ActivityEvent } from "../types/room-view.types";
import { activityIconOf } from "./activity-icon.util";

const event = (kind: ActivityEvent["kind"], stream?: "screen" | "camera") => ({ kind, stream }) as ActivityEvent;

describe("an event's icon", () => {
  it("shows what was shared for a stream that starts or stops", () => {
    expect(activityIconOf(event("started", "screen"))).toBe("stream-screen");
    expect(activityIconOf(event("stopped", "camera"))).toBe("stream-camera");
  });

  it("shows a door for someone coming or going, and an arrow for a connection back", () => {
    expect(activityIconOf(event("joined"))).toBe("joined");
    expect(activityIconOf(event("left"))).toBe("left");
    expect(activityIconOf(event("reconnected"))).toBe("reconnected");
  });
});
