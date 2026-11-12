import type { LiveFeed, Sharer } from "../../../../types/room-view.types";

/** A preview in words: what's in front, its spoken name, its picture's, and its name pill's. */
export function previewWords(s: Sharer, feed: LiveFeed) {
  const what = feed.kind === "camera" ? "camera" : "screen";
  const Whose = s.isMe ? "Your" : `${s.person.name}'s`;
  const pill = `${s.isMe ? "You" : s.person.name} · ${what}`;
  return {
    // The spoken name holds the words shown, so a voice command that says them finds it.
    label: `Watch ${pill}`,
    picture: `${Whose} ${what === "screen" ? "shared screen" : "camera"}`,
    pill,
  };
}
