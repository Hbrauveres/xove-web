/** What "…" shows, from what folded into it. */
export interface MoreSections {
  settings: boolean;
  goLive: boolean;
  sound: boolean;
  voice: boolean;
  /** A line between what starts or sets up and what I hear. */
  line: boolean;
  /** The settings open from "…": Go live's or the settings folded into it. */
  holdsSettings: boolean;
}
