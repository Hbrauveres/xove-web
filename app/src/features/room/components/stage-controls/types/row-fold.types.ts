/** A button over someone else's stream that can fold into "…". */
export type FoldKey = "settings" | "go-live" | "sound" | "voice";

/** One button in the bar over someone else's stream, in the bar's order, with its width in px. */
export interface RowButton {
  key: FoldKey | "mic";
  width: number;
}

/** What sits on the picture: the bar over someone else's stream, or my own row. */
export type RowItems = { viewer: RowButton[] } | { own: number };

/** How the controls fit a picture this wide. */
export interface RowFit {
  /** The buttons in "…", in the order they folded. */
  folded: FoldKey[];
  /** My own buttons' size: L 48, or M 34 when they don't fit. */
  size: "l" | "m";
  /** My own row beside the fullscreen button, when there's no room to centre it. */
  beside: boolean;
}

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
}
