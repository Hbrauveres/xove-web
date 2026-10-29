import type { VoiceProblem } from "@core/devices/types/devices.types";

/** Why the mic couldn't be had: none there (or none that fits), or the browser said no. */
export function problemOf(e: unknown): VoiceProblem {
  const name = e instanceof DOMException ? e.name : "";
  return name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "blocked";
}
