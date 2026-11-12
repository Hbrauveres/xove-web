import { describe, expect, it } from "vitest";
import { personNote } from "./person-note.util";

const nameOf = (id: string) => (id === "me" ? "you" : "Bruno");

describe("the line under a person's name", () => {
  it("says what they share", () => {
    const sharing = {
      a: { screen: true, camera: true },
      b: { screen: true, camera: false },
      c: { screen: false, camera: true },
    };
    expect(personNote("a", sharing, {}, nameOf)).toBe("Sharing screen and camera");
    expect(personNote("b", sharing, {}, nameOf)).toBe("Sharing their screen");
    expect(personNote("c", sharing, {}, nameOf)).toBe("Sharing their camera");
  });

  it("says whose stream they watch, or that they're just in the room", () => {
    const live = { bruno: { screen: true, camera: false }, me: { screen: false, camera: true } };
    expect(personNote("d", live, { d: { sharerId: "bruno", kind: "screen" } }, nameOf)).toBe("Watching Bruno");
    expect(personNote("d", live, { d: { sharerId: "me", kind: "camera" } }, nameOf)).toBe("Watching you");
    expect(personNote("d", live, {}, nameOf)).toBe("In the room");
  });

  it("never says they watch someone who isn't live: after everyone stops, they're just in the room", () => {
    const stopped = { bruno: { screen: false, camera: false } };
    expect(personNote("d", stopped, { d: { sharerId: "bruno", kind: "screen" } }, nameOf)).toBe("In the room");
    expect(personNote("d", {}, { d: { sharerId: "bruno", kind: "screen" } }, nameOf)).toBe("In the room");
  });
});
