export interface FaceProps {
  /** Whose face: its first letter is the initial. */
  name: string;
  /** In the room: the person's own colour, from their id, with a white initial. */
  hue?: number | undefined;
  /** A real user's photo; while it's missing or broken, their initial. */
  photo?: string | null | undefined;
  /** Width and height, in px. */
  size: number;
  /** A red ring while this person is live. */
  onAir?: boolean | undefined;
  /** While live, my voice is being sent: the ring turns the speaking green, at the same width. */
  talking?: boolean | undefined;
  /** Where the ring goes: around the face, or inside its edge, to line up with what's beside it. */
  ring?: "outside" | "inside" | undefined;
}

/** The ring a room face wears: none, live (around the face or inside its edge), talking or not. */
export interface FaceRing {
  /** The stylesheet's class for the ring, or none. */
  look: "onAir" | "onAirInside" | null;
  "data-ring": "outside" | "inside" | undefined;
  "data-talking": true | undefined;
}
