import { expect, it } from "vitest";
import { seenVideo } from "./seen-video.util";

it("remembers the stream whose video has played, until another takes the stage", () => {
  // Starting: no video yet, none seen.
  expect(seenVideo(null, "user-2:screen", false)).toBeNull();
  // Its video arrives: seen.
  expect(seenVideo(null, "user-2:screen", true)).toBe("user-2:screen");
  // Its video goes (it's stopping): still seen, so no "Loading…".
  expect(seenVideo("user-2:screen", "user-2:screen", false)).toBe("user-2:screen");
  // Another stream, still on its way: not seen.
  expect(seenVideo("user-2:screen", "user-3:screen", false)).toBeNull();
});
