/** The streams a person can share, in the order their icons show. */
export const STREAMS = ["screen", "camera"] as const;

/** The line under a sharer's name, by what they share (screen-camera). */
export const SHARING_NOTE: Record<string, string> = {
  "true-true": "Sharing screen and camera",
  "true-false": "Sharing their screen",
  "false-true": "Sharing their camera",
};
