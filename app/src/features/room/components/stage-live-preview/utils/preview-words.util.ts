import type { LiveFeed, Sharer } from "../../../types/room-view.types";

/** A preview in words: what's in front, its spoken name, its picture's, and its name pill's. */
export function previewWords(s: Sharer, feed: LiveFeed) {
  const what = feed.kind === "camera" ? "camera" : "screen";
  const whose = s.isMe ? "your" : `${s.person.name}'s`;
  const Whose = s.isMe ? "Your" : `${s.person.name}'s`;
  return {
    label: `Watch ${whose} ${what}`,
    picture: `${Whose} ${what === "screen" ? "shared screen" : "camera"}`,
    pill: `${s.isMe ? "You" : s.person.name} · ${what}`,
  };
}
