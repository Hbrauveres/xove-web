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
    expect(personNote("d", {}, { d: { sharerId: "bruno", kind: "screen" } }, nameOf)).toBe("Watching Bruno");
    expect(personNote("d", {}, { d: { sharerId: "me", kind: "screen" } }, nameOf)).toBe("Watching you");
    expect(personNote("d", {}, {}, nameOf)).toBe("In the room");
  });
});
