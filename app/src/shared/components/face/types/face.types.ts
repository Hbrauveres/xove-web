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
  /** Where the ring goes: around the face, or inside its edge, to line up with what's beside it. */
  ring?: "outside" | "inside" | undefined;
}
