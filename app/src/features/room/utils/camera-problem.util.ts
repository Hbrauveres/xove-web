import { CAMERA_BLOCKED, CAMERA_MISSING } from "@services/media-devices-service";

/** What the settings say when my camera can't be shown. */
export function cameraProblemWords(problem: "blocked" | "missing" | null | undefined) {
  if (!problem) return null;
  return problem === "blocked" ? CAMERA_BLOCKED : CAMERA_MISSING;
}
