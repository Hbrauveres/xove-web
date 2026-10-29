import { describe, expect, it } from "vitest";
import { whoIsHere } from "../../utils/who-is-here.util";

describe("who is here, for an empty stage", () => {
  it("says so when nobody else is here", () => {
    expect(whoIsHere([])).toBe("Nobody else is here yet.");
  });

  it("names one, two or three people", () => {
    expect(whoIsHere(["Bruno"])).toBe("Bruno is here.");
    expect(whoIsHere(["Bruno", "Ana"])).toBe("Bruno and Ana are here.");
    expect(whoIsHere(["Bruno", "Ana", "Diego"])).toBe("Bruno, Ana and Diego are here.");
  });

  it("names two, then counts the others, past three", () => {
    expect(whoIsHere(["Bruno", "Ana", "Diego", "Carla", "Leo", "Rui", "Bia"])).toBe(
      "Bruno, Ana and 5 others are here.",
    );
  });
});
