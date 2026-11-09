import type { FaceRing } from "../types/face.types";

/** Ringed only while live; talking only on a live face. */
export function faceRing(onAir: boolean, ring: "outside" | "inside", talking: boolean): FaceRing {
  if (!onAir) return { look: null, "data-ring": undefined, "data-talking": undefined };
  return {
    look: ring === "inside" ? "onAirInside" : "onAir",
    "data-ring": ring,
    "data-talking": talking || undefined,
  };
}
