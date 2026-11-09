/** My mic's round button. */
export interface StageMyMicProps {
  on: boolean;
  /** My voice is being sent right now: the mic wears the talking cue (only while it's on). */
  speaking?: boolean | undefined;
  size: "m" | "l";
  onClick?: (() => void) | undefined;
}
