import type { Sharer } from "../../../types/room-view.types";

/** What a person shares, in two words, and "· voice" while their voice is on (never my own). */
export const whatOf = (s: Sharer) =>
  (s.screen && s.camera ? "Screen with camera" : s.screen ? "Screen" : "Camera") +
  (!s.isMe && s.hasVoice ? " · voice" : "");
