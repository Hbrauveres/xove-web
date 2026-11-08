import { expect, it } from "vitest";
import { startingNotice } from "./starting-notice.util";

it("says my share is starting, or whose stream is loading", () => {
  expect(startingNotice(true, "Henrique", "screen")).toEqual({
    title: "Starting your share…",
    text: "Your screen shows here in a moment.",
  });
  expect(startingNotice(false, "Marina", "camera")).toEqual({
    title: "Loading Marina's camera…",
    text: "The video starts in a moment.",
  });
});
