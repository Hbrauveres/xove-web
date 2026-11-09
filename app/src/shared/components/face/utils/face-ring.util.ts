/** The ring a room face wears: none, live (around the face or inside its edge), talking or not. */
export interface FaceRing {
  /** The stylesheet's class for the ring, or none. */
  look: "onAir" | "onAirInside" | null;
  "data-ring": "outside" | "inside" | undefined;
  "data-talking": true | undefined;
}

/** Ringed only while live; talking only on a live face. */
export function faceRing(onAir: boolean, ring: "outside" | "inside", talking: boolean): FaceRing {
  if (!onAir) return { look: null, "data-ring": undefined, "data-talking": undefined };
  return {
    look: ring === "inside" ? "onAirInside" : "onAir",
    "data-ring": ring,
    "data-talking": talking || undefined,
  };
}
