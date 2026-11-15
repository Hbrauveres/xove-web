export interface LiveDotProps {
  /** s (6 px) on a tab; m (8 px) on a pill (Go live, Waiting for approval). */
  size: "s" | "m";
  /** It beats as LIVE's dot does: something going on that you wait for (Waiting for approval). */
  pulse?: boolean | undefined;
  /** Its place, set by what holds it. */
  className?: string | undefined;
}
