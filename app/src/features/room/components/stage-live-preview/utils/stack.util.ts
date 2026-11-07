import type { Sharer } from "../../../types/room-view.types";

/**
 * A preview's pictures: the one in front (their screen, or their camera when swapped or when that's
 * all they share) and, for a screen and a camera together, the other one behind. My own streams
 * play from my browser; someone else's from LiveKit, once they arrive.
 */
export function stackOf(s: Sharer, swapped: boolean) {
  const both = Boolean(s.screen && s.camera);
  const feed = (both && swapped ? s.camera : s.screen) ?? s.camera;
  const back = both ? (feed === s.screen ? s.camera : s.screen) : undefined;
  const playing = (f: typeof feed) => f && (s.isMe ? f.local : f.remote?.video);
  return { both, feed, video: playing(feed), back, backVideo: playing(back) };
}
