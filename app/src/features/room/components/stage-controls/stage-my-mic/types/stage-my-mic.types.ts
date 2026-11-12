/** My mic's round button. */
export interface StageMyMicProps {
  on: boolean;
  size: "m" | "l";
  onClick?: (() => void) | undefined;
}
