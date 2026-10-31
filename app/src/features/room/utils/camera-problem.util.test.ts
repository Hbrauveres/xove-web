import { expect, it } from "vitest";
import { CAMERA_BLOCKED, CAMERA_MISSING } from "@services/media-devices-service";
import { cameraProblemWords } from "./camera-problem.util";

it("says what's wrong with the camera, or nothing", () => {
  expect(cameraProblemWords("blocked")).toBe(CAMERA_BLOCKED);
  expect(cameraProblemWords("missing")).toBe(CAMERA_MISSING);
  expect(cameraProblemWords(null)).toBeNull();
});
