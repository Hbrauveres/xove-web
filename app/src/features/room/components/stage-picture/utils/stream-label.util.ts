import type { LiveFeed, Sharer } from "../../../types/room-view.types";

/** What a stream is called: "camera" or "shared screen". */
export function streamName(feed: LiveFeed): string {
  return feed.kind === "camera" ? "camera" : "shared screen";
}

/** A stream's spoken name, for whose it is: "Your camera", "Bruno's shared screen". */
export function streamLabel(sharer: Sharer, feed: LiveFeed): string {
  return sharer.isMe ? `Your ${streamName(feed)}` : `${sharer.person.name}'s ${streamName(feed)}`;
}
