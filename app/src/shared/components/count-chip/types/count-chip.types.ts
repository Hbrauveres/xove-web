export interface CountChipProps {
  count: number;
  /** Neutral, or red when it needs you (requests waiting). */
  tone?: "neutral" | "attention" | undefined;
}
