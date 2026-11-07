import { expect, it } from "vitest";
import { streamIcon } from "./stream-icon.util";

it("crosses a stream that's off, and offers to share a screen when pointed at", () => {
  expect(streamIcon("camera", true)).toEqual({ rest: "camera-on" });
  expect(streamIcon("camera", false)).toEqual({ rest: "camera-off" });
  expect(streamIcon("screen", true)).toEqual({ rest: "screen-on" });
  expect(streamIcon("screen", false)).toEqual({ rest: "screen-off", hover: "screen-share" });
});
