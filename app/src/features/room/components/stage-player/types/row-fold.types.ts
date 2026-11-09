import type { FoldKey } from "../../../types/fold-key.types";

/** One button in the bar over someone else's stream, in the bar's order, with its width in px. */
export interface RowButton {
  key: FoldKey | "mic" | "unmute";
  width: number;
}

/** What sits on the picture: the bar over someone else's stream, or my own row. */
export type RowItems = { viewer: RowButton[] } | { own: number };

/** What the row on the picture holds: nobody live, someone else's stream, or my own. */
export interface RowShape {
  /** My own stream is on the stage. */
  mine: boolean;
  /** Nobody is live: only the settings. */
  settingsOnly: boolean;
  /** Over someone else's stream: their screen's sound, their voice, and my mic (I'm live) or Go live. */
  sound: boolean;
  voice: boolean;
  live: boolean;
  /** The browser holds the room's sound back: the unmute pill in the sounds' place, never folded. */
  held: boolean;
}
